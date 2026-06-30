import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSpotUpdateSchema, zodFirstErrorMessage } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; spotId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, spotId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = venueSpotUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const existing = await prisma.venueSpot.findFirst({
    where: { id: spotId, venueId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η θέση δεν βρέθηκε." }, { status: 404 });
  }

  const label = parsed.data.label.trim();
  if (label === existing.label) {
    return NextResponse.json({ spot: existing, message: "Η θέση ενημερώθηκε." });
  }

  try {
    const spot = await prisma.venueSpot.update({
      where: { id: spotId },
      data: { label },
    });
    return NextResponse.json({ spot, message: "Η περιγραφή αποθηκεύτηκε." });
  } catch {
    return NextResponse.json({ error: "Υπάρχει ήδη θέση με αυτό το όνομα." }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, spotId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const deleted = await prisma.venueSpot.deleteMany({
    where: { id: spotId, venueId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Η θέση δεν βρέθηκε." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Η θέση διαγράφηκε." });
}
