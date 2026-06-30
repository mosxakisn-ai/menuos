import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSpotBulkCreateSchema, venueSpotCreateSchema } from "@menuos/shared";
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

  const spots = await prisma.venueSpot.findMany({
    where: { venueId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

  return NextResponse.json({ spots });
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

  const bulk = venueSpotBulkCreateSchema.safeParse(body);
  if (bulk.success) {
    const labels: string[] = [];
    for (let n = bulk.data.from; n <= bulk.data.to; n++) {
      labels.push(String(n));
    }
    const created = await prisma.$transaction(
      labels.map((label, index) =>
        prisma.venueSpot.upsert({
          where: {
            venueId_type_label: { venueId, type: bulk.data.type, label },
          },
          create: { venueId, type: bulk.data.type, label, sortOrder: index },
          update: {},
        }),
      ),
    );
    return NextResponse.json({
      spots: created,
      message: `Προστέθηκαν ${created.length} θέσεις.`,
    });
  }

  const single = venueSpotCreateSchema.safeParse(body);
  if (!single.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const label = single.data.label.trim();
  const maxSort = await prisma.venueSpot.aggregate({
    where: { venueId, type: single.data.type },
    _max: { sortOrder: true },
  });

  try {
    const spot = await prisma.venueSpot.create({
      data: {
        venueId,
        type: single.data.type,
        label,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ spot, message: "Η θέση προστέθηκε." });
  } catch {
    return NextResponse.json({ error: "Η θέση υπάρχει ήδη." }, { status: 409 });
  }
}
