import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import { venueStaffMemberCreateSchema, listVenuePosts, normalizeStaffMemberZoneId, staffPostRequiresZoneAssignment, staffPrimaryAssignment, validateStaffAssignments, validateStaffMessageScope, zodFirstErrorMessage } from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { canManageVenueSecrets } from "@/lib/dashboard-roles";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const includeSecrets = canManageVenueSecrets(auth.session!.role);
  const members = await prisma.venueStaffMember.findMany({
    where: { venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    ...(includeSecrets
      ? {}
      : {
          select: {
            id: true,
            name: true,
            roleLabel: true,
            stations: true,
            zoneId: true,
            messageScope: true,
            sortOrder: true,
            venueId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
  });

  const zoneFixes: Promise<unknown>[] = [];
  const normalizedMembers = members.map((member) => {
    const zoneId = normalizeStaffMemberZoneId(
      staffPrimaryAssignment(member.stations),
      member.zoneId,
    );
    if (zoneId !== member.zoneId) {
      zoneFixes.push(
        prisma.venueStaffMember.update({ where: { id: member.id }, data: { zoneId } }),
      );
      return { ...member, zoneId };
    }
    return member;
  });
  if (zoneFixes.length > 0) await Promise.all(zoneFixes);

  return NextResponse.json({ members: normalizedMembers });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
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

  const opsConfig = await getVenueOperationsConfig(venueId);
  const posts = listVenuePosts(opsConfig);
  if (!validateStaffAssignments(parsed.data.stations, posts)) {
    return NextResponse.json(
      { error: "Επίλεξε έγκυρα πόστα από Ρυθμίσεις → Πόστα." },
      { status: 400 },
    );
  }
  if (
    parsed.data.messageScope &&
    !validateStaffMessageScope(parsed.data.messageScope, posts)
  ) {
    return NextResponse.json(
      { error: "Επίλεξε έγκυρα μηνύματα από Ρυθμίσεις → Μηνύματα." },
      { status: 400 },
    );
  }
  const primaryPost = parsed.data.stations[0] ?? "services";
  if (staffPostRequiresZoneAssignment(primaryPost) && !parsed.data.zoneId) {
    return NextResponse.json(
      { error: "Ο σερβιτόρος χρειάζεται συγκεκριμένο χώρο (π.χ. Σάλα ή Αυλή)." },
      { status: 400 },
    );
  }
  const zoneId = normalizeStaffMemberZoneId(primaryPost, parsed.data.zoneId);

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
      zoneId,
      messageScope: parsed.data.messageScope,
      stations: parsed.data.stations,
      memberToken: randomUUID(),
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ member, message: "Προστέθηκε στο προσωπικό." });
}
