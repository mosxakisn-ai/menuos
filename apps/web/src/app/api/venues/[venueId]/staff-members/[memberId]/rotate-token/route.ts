import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; memberId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, memberId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const existing = await prisma.venueStaffMember.findFirst({
    where: { id: memberId, venueId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Το μέλος δεν βρέθηκε." }, { status: 404 });
  }

  const memberToken = randomUUID();
  const member = await prisma.venueStaffMember.update({
    where: { id: memberId },
    data: { memberToken },
  });

  await prisma.pushSubscription.deleteMany({ where: { staffMemberId: memberId } });

  return NextResponse.json({
    member,
    memberToken,
    message: "Το προσωπικό link ανανεώθηκε. Το παλιό δεν λειτουργεί πλέον.",
  });
}
