import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueStaffMemberUpdateSchema, listVenuePosts, validateStaffAssignments, zodFirstErrorMessage } from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; memberId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, memberId } = await params;
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

  const parsed = venueStaffMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  const opsConfig = await getVenueOperationsConfig(venueId);
  const posts = listVenuePosts(opsConfig);
  if (!validateStaffAssignments(parsed.data.stations, posts)) {
    return NextResponse.json(
      { error: "Επίλεξε έγκυρα πόστα από Ρυθμίσεις → Πόστα." },
      { status: 400 },
    );
  }

  const existing = await prisma.venueStaffMember.findFirst({
    where: { id: memberId, venueId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Το μέλος δεν βρέθηκε." }, { status: 404 });
  }

  const member = await prisma.venueStaffMember.update({
    where: { id: memberId },
    data: {
      name: parsed.data.name,
      roleLabel: parsed.data.roleLabel,
      stations: parsed.data.stations,
    },
  });

  return NextResponse.json({ member, message: "Αποθηκεύτηκε." });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, memberId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const deleted = await prisma.venueStaffMember.deleteMany({
    where: { id: memberId, venueId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Το μέλος δεν βρέθηκε." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Διαγράφηκε." });
}
