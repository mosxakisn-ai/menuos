import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { menuCreateSchema } from "@menuos/shared";
import { canOrganizationAddMenu } from "@/lib/billing";
import { requireActiveSubscription } from "@/lib/api-auth";
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

  const menuCheck = await canOrganizationAddMenu(auth.session!.organizationId, venue.id);
  if (!menuCheck.ok) {
    return NextResponse.json({ error: menuCheck.error, code: menuCheck.code }, { status: 403 });
  }

  const count = await prisma.menu.count({ where: { venueId: venue.id } });
  const menu = await prisma.menu.create({
    data: {
      venueId: venue.id,
      name: parsed.data.name.trim(),
      type: parsed.data.type ?? "RESTAURANT",
      sortOrder: count,
    },
  });

  return NextResponse.json({ menu, message: "Το menu δημιουργήθηκε." });
}
