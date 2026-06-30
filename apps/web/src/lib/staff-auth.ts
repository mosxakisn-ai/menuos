import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { SessionPayload } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { getOrganizationPlanContext } from "@/lib/billing";
import { getVenueForOrganization } from "@/lib/venue-access";
import { readStaffSessionFromCookies } from "@/lib/staff-session";

export type StaffVenueContext = {
  id: string;
  slug: string;
  name: string;
  organizationId: string;
};

export type WaiterAccess =
  | { mode: "session"; session: SessionPayload; venue: StaffVenueContext }
  | { mode: "staff"; venue: StaffVenueContext };

export function staffKeyFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const key = (body as { staffKey?: unknown }).staffKey;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

/** Prefer header, then httpOnly staff session cookie, then legacy query/body. */
export async function resolveStaffKey(request: Request, venueId: string): Promise<string | null> {
  const header = request.headers.get("x-menuos-staff-key")?.trim();
  if (header) return header;

  const session = await readStaffSessionFromCookies();
  if (session?.venueId === venueId) return session.staffToken;

  const url = new URL(request.url);
  const query = url.searchParams.get("staffKey")?.trim();
  return query || null;
}

export async function resolveVenueByStaffKey(
  venueId: string,
  staffKey: string,
): Promise<StaffVenueContext | null> {
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, staffToken: staffKey },
    select: { id: true, slug: true, name: true, organizationId: true },
  });
  return venue;
}

export async function resolveVenueByStaffSlug(
  venueSlug: string,
  staffKey: string,
): Promise<StaffVenueContext | null> {
  const venue = await prisma.venue.findFirst({
    where: { slug: venueSlug, staffToken: staffKey },
    select: { id: true, slug: true, name: true, organizationId: true },
  });
  return venue;
}

async function organizationIsActive(organizationId: string): Promise<boolean> {
  const ctx = await getOrganizationPlanContext(organizationId);
  return Boolean(ctx?.active);
}

export async function requireWaiterVenueAccess(
  request: Request,
  venueId: string,
): Promise<{ access: WaiterAccess; response: null } | { access: null; response: NextResponse }> {
  const session = await getSession();
  if (session) {
    const venue = await getVenueForOrganization(venueId, session.organizationId);
    if (!venue) {
      return {
        access: null,
        response: NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 }),
      };
    }
    if (!(await organizationIsActive(session.organizationId))) {
      return {
        access: null,
        response: NextResponse.json(
          { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
          { status: 403 },
        ),
      };
    }
    return {
      access: {
        mode: "session",
        session,
        venue: {
          id: venue.id,
          slug: venue.slug,
          name: venue.name,
          organizationId: session.organizationId,
        },
      },
      response: null,
    };
  }

  const staffKey = await resolveStaffKey(request, venueId);
  if (!staffKey) {
    return {
      access: null,
      response: NextResponse.json(
        { error: "Μη έγκυρο link σερβιτόρου.", code: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  const venue = await resolveVenueByStaffKey(venueId, staffKey);
  if (!venue) {
    return {
      access: null,
      response: NextResponse.json(
        { error: "Μη έγκυρο link σερβιτόρου.", code: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (!(await organizationIsActive(venue.organizationId))) {
    return {
      access: null,
      response: NextResponse.json(
        { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
        { status: 403 },
      ),
    };
  }

  return { access: { mode: "staff", venue }, response: null };
}

export async function requireWaiterCallAccess(
  request: Request,
  callId: string,
  staffKeyFromRequestBody?: string | null,
): Promise<
  | { access: WaiterAccess; callVenueId: string; response: null }
  | { access: null; callVenueId: null; response: NextResponse }
> {
  const existing = await prisma.waiterCall.findUnique({
    where: { id: callId },
    select: {
      venueId: true,
      venue: { select: { id: true, slug: true, name: true, organizationId: true } },
    },
  });
  if (!existing) {
    return {
      access: null,
      callVenueId: null,
      response: NextResponse.json({ error: "Η κλήση δεν βρέθηκε." }, { status: 404 }),
    };
  }

  const fakeRequest = staffKeyFromRequestBody
    ? new Request(request.url, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          "x-menuos-staff-key": staffKeyFromRequestBody,
        },
      })
    : request;

  const result = await requireWaiterVenueAccess(fakeRequest, existing.venueId);
  if (result.response) {
    return { access: null, callVenueId: null, response: result.response };
  }

  return { access: result.access, callVenueId: existing.venueId, response: null };
}

export function buildStaffWaiterUrl(slug: string, staffToken: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "https://menuos.gr";
  const url = new URL(`/s/${slug}`, base);
  url.searchParams.set("key", staffToken);
  return url.toString();
}
