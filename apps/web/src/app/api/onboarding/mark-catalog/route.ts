import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import { backfillOrganizationMenuTranslations } from "@/lib/catalog-backfill-translations";
import { seedOnboardingVenueInTransaction } from "@/lib/seed-onboarding-venue";
import { serializableTransaction } from "@/lib/plan-limits";

/** Onboarding step 2 — persist starter catalog (categories + items) to the first venue menu. */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;
  const session = auth.session!;

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      slug: true,
      venues: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          slug: true,
          menus: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } },
        },
      },
    },
  });

  const venue = org?.venues[0];
  const menuId = venue?.menus[0]?.id;
  if (!org || !venue || !menuId) {
    return NextResponse.json({ code: "no_venue" }, { status: 404 });
  }

  await prisma.$transaction(
    async (tx) =>
      seedOnboardingVenueInTransaction(
        tx,
        {
          organizationId: session.organizationId,
          organizationSlug: org.slug,
          venueId: venue.id,
          venueSlug: venue.slug,
          menuId,
        },
        { menu: true, spots: false, staff: false, paraliaScreen: false, hours: false },
      ),
    serializableTransaction,
  );

  const itemCount = await prisma.item.count({
    where: { category: { menuId } },
  });
  if (itemCount === 0) {
    return NextResponse.json({ code: "seed_failed" }, { status: 422 });
  }

  void backfillOrganizationMenuTranslations(session.organizationId).catch(() => undefined);

  return NextResponse.json({ ok: true, itemCount });
}