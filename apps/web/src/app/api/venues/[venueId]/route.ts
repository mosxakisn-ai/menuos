import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueUpdateSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { canManageVenueSecrets } from "@/lib/dashboard-roles";
import { getVenueForOrganization } from "@/lib/venue-access";
import { stripVenueSecrets } from "@/lib/venue-secrets";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  return NextResponse.json({
    venue: stripVenueSecrets(venue, canManageVenueSecrets(auth.session!.role)),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;
  const { venueId } = await params;
  const existing = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: A.venueNotFound }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = venueUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: A.invalidData }, { status: 400 });
  }

  const { logoUrl, ...rest } = parsed.data;
  const normalizedLogo =
    logoUrl === undefined ? undefined : logoUrl === "" || logoUrl === null ? null : logoUrl.trim();

  const venue = await prisma.venue.update({
    where: { id: venueId },
    data: {
      ...rest,
      ...(normalizedLogo !== undefined ? { logoUrl: normalizedLogo } : {}),
    },
  });

  return NextResponse.json({ venue, message: A.venueSaved });
}
