import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const existing = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const staffToken = randomUUID();

  await prisma.$transaction([
    prisma.venue.update({
      where: { id: venueId },
      data: { staffToken },
    }),
    prisma.pushSubscription.deleteMany({
      where: { venueId },
    }),
  ]);

  return NextResponse.json({
    staffToken,
    message: "Ο κωδικός σερβιτόρου άλλαξε. Στείλε το νέο link στο προσωπικό.",
  });
}
