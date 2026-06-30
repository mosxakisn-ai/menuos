import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { menuCreateSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { planLimitErrorResponse, assertCanAddMenuInTransaction } from "@/lib/plan-limits";
import { getVenueForOrganization } from "@/lib/venue-access";

export async function GET(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const menus = await prisma.menu.findMany({
    where: { venueId },
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          translations: true,
          items: {
            orderBy: { sortOrder: "asc" },
            include: { translations: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ menus, venue: { id: venue.id, name: venue.name, slug: venue.slug } });
}

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = menuCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία menu." }, { status: 400 });
  }

  const venue = await getVenueForOrganization(parsed.data.venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  try {
    const menu = await prisma.$transaction(async (tx) => {
      await assertCanAddMenuInTransaction(tx, auth.session!.organizationId, venue.id);
      const count = await tx.menu.count({ where: { venueId: venue.id } });
      return tx.menu.create({
        data: {
          venueId: venue.id,
          name: parsed.data.name.trim(),
          type: parsed.data.type ?? "RESTAURANT",
          sortOrder: count,
        },
      });
    });

    return NextResponse.json({ menu, message: "Το menu δημιουργήθηκε." });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ error: limit.error, code: limit.code }, { status: limit.status });
    }
    throw err;
  }
}
