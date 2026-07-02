import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { menuCreateSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import { planLimitErrorResponse, assertCanAddMenuInTransaction, serializableTransaction } from "@/lib/plan-limits";
import { getVenueForOrganization } from "@/lib/venue-access";

export async function GET(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
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

  const copy = dashboardCopyFromRequest(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  const parsed = menuCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(parsed.data.venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
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
    }, serializableTransaction);

    return NextResponse.json({ menu, message: copy.api.menuCreated });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ code: limit.code }, { status: limit.status });
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const menuCount = await tx.menu.count({ where: { venueId } });
      if (menuCount === 0) throw new Error("no_menus");

      const categoryCount = await tx.category.count({ where: { menu: { venueId } } });
      const itemCount = await tx.item.count({ where: { category: { menu: { venueId } } } });

      await tx.menu.deleteMany({ where: { venueId } });

      const menu = await tx.menu.create({
        data: {
          venueId,
          name: copy.api.defaultMenuName,
          type: "RESTAURANT",
          sortOrder: 0,
        },
      });

      return {
        deletedMenus: menuCount,
        deletedCategories: categoryCount,
        deletedItems: itemCount,
        menu,
      };
    }, serializableTransaction);

    return NextResponse.json({
    ok: true,
    message: copy.api.allMenusDeleted({
      menus: result.deletedMenus,
      items: result.deletedItems,
    }),
    ...result,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "no_menus") {
      return NextResponse.json({ code: "not_found" }, { status: 404 });
    }
    throw err;
  }
}
