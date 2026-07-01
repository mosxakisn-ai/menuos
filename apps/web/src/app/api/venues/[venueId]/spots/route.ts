import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { venueSpotBulkCreateSchema, venueSpotCreateSchema, zodFirstErrorMessage } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";

type Params = { params: Promise<{ venueId: string }> };

function isBulkBody(body: unknown): body is { from: unknown; to: unknown } {
  return typeof body === "object" && body !== null && "from" in body && "to" in body;
}

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

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;
  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: A.venueNotFound }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const bulkResult = venueSpotBulkCreateSchema.safeParse(body);
  if (bulkResult.success) {
    const prefix = bulkResult.data.prefix ?? "";
    const labels: string[] = [];
    for (let n = bulkResult.data.from; n <= bulkResult.data.to; n++) {
      labels.push(`${prefix}${n}`);
    }
    const maxSort = await prisma.venueSpot.aggregate({
      where: { venueId, type: bulkResult.data.type },
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder ?? -1) + 1;
    const created = await prisma.$transaction(
      labels.map((label) => {
        const sortOrder = nextSort++;
        return prisma.venueSpot.upsert({
          where: {
            venueId_type_label: { venueId, type: bulkResult.data.type, label },
          },
          create: { venueId, type: bulkResult.data.type, label, sortOrder },
          update: {},
        });
      }),
    );
    return NextResponse.json({
      spots: created,
      message: A.spotsBulkAdded(created.length),
    });
  }

  const singleResult = venueSpotCreateSchema.safeParse(body);
  if (singleResult.success) {
    const label = singleResult.data.label.trim();
    const maxSort = await prisma.venueSpot.aggregate({
      where: { venueId, type: singleResult.data.type },
      _max: { sortOrder: true },
    });

    try {
      const spot = await prisma.venueSpot.create({
        data: {
          venueId,
          type: singleResult.data.type,
          label,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        },
      });
      return NextResponse.json({ spot, message: A.spotAdded });
    } catch {
      return NextResponse.json({ error: A.spotExists }, { status: 409 });
    }
  }

  const message = isBulkBody(body)
    ? zodFirstErrorMessage(bulkResult.error)
    : zodFirstErrorMessage(singleResult.error);

  return NextResponse.json({ error: message }, { status: 400 });
}
