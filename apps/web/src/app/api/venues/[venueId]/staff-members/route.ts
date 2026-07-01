import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueStaffMemberCreateSchema, zodFirstErrorMessage } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const members = await prisma.venueStaffMember.findMany({
    where: { venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId } = await params;
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

  const parsed = venueStaffMemberCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  const count = await prisma.venueStaffMember.count({ where: { venueId } });
  if (count >= 80) {
    return NextResponse.json({ error: "Έφτασες το όριο προσωπικού (80)." }, { status: 400 });
  }

  const maxSort = await prisma.venueStaffMember.aggregate({
    where: { venueId },
    _max: { sortOrder: true },
  });

  const member = await prisma.venueStaffMember.create({
    data: {
      venueId,
      name: parsed.data.name,
      roleLabel: parsed.data.roleLabel,
      stations: parsed.data.stations,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ member, message: "Προστέθηκε στο προσωπικό." });
}
