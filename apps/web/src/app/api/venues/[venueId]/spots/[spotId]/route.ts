import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; spotId: string }> };

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
