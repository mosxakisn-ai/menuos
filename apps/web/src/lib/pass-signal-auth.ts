import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import { getSession } from "@/lib/auth";
import { getVenueForOrganization } from "@/lib/venue-access";
import { getOrganizationPlanContext } from "@/lib/billing";
import { resolveStaffKey, resolveVenueByStaffKey, type StaffVenueContext } from "@/lib/staff-auth";

export type PassSignalVenue = StaffVenueContext & {
  kitchenScreenToken: string;
  barScreenToken: string;
};

async function loadVenueById(venueId: string): Promise<PassSignalVenue | null> {
  return prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      slug: true,
      name: true,
      organizationId: true,
      kitchenScreenToken: true,
      barScreenToken: true,
    },
  });
}

async function loadVenueBySlug(slug: string): Promise<PassSignalVenue | null> {
  return prisma.venue.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      organizationId: true,
      kitchenScreenToken: true,
      barScreenToken: true,
    },
  });
}

function screenTokenMatches(venue: PassSignalVenue, station: PassStationInput, stationKey: string): boolean {
  if (station === "kitchen") return venue.kitchenScreenToken === stationKey;
  if (station === "bar") return venue.barScreenToken === stationKey;
  return false;
}

/** Dashboard session, waiter staff key, or kitchen/bar screen token. */
export async function authorizePassSignalCreate(
  request: Request,
  input: {
    venueId?: string;
    venueSlug?: string;
    station: PassStationInput;
    stationKey?: string;
  },
): Promise<{ venue: PassSignalVenue; response: null } | { venue: null; response: NextResponse }> {
  const venue =
    (input.venueId ? await loadVenueById(input.venueId) : null) ??
    (input.venueSlug ? await loadVenueBySlug(input.venueSlug.trim()) : null);

  if (!venue) {
    return {
      venue: null,
      response: NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 }),
    };
  }

  const planCtx = await getOrganizationPlanContext(venue.organizationId);
  if (!planCtx?.active) {
    return {
      venue: null,
      response: NextResponse.json(
        { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
        { status: 403 },
      ),
    };
  }

  const key = input.stationKey?.trim();
  if (key && (input.station === "kitchen" || input.station === "bar")) {
    if (screenTokenMatches(venue, input.station, key)) {
      return { venue, response: null };
    }
    return {
      venue: null,
      response: NextResponse.json({ error: "Μη εξουσιοδοτημένο.", code: "unauthorized" }, { status: 401 }),
    };
  }

  const session = await getSession();
  if (session) {
    const owned = await getVenueForOrganization(venue.id, session.organizationId);
    if (owned) return { venue, response: null };
  }

  const staffKey = await resolveStaffKey(request, venue.id);
  if (staffKey) {
    const staffVenue = await resolveVenueByStaffKey(venue.id, staffKey);
    if (staffVenue) return { venue, response: null };
  }

  return {
    venue: null,
    response: NextResponse.json({ error: "Μη εξουσιοδοτημένο.", code: "unauthorized" }, { status: 401 }),
  };
}

export function buildStationScreenUrl(
  path: "/kds" | "/bds",
  slug: string,
  screenToken: string,
): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "https://menuos.gr";
  const url = new URL(path, base);
  url.searchParams.set("venueSlug", slug);
  url.searchParams.set("key", screenToken);
  return url.toString();
}
