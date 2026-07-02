import { randomUUID } from "node:crypto";
import { prisma, type Prisma } from "@menuos/db";
import {
  countOnboardingStarterItems,
  ONBOARDING_EXTRA_STATION_SCREEN,
  ONBOARDING_ITEM_PHOTOS,
  ONBOARDING_OPENING_HOURS,
  ONBOARDING_STARTER_CATEGORIES,
  ONBOARDING_STARTER_SPOTS,
  ONBOARDING_STARTER_STAFF,
  shouldSeedOnboardingVenue,
} from "@menuos/shared";
import {
  assertCanAddItemsInTransaction,
  PlanLimitError,
  serializableTransaction,
} from "@/lib/plan-limits";

export { shouldSeedOnboardingVenue };

function isRetryableSeedError(err: unknown): boolean {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
  return code === "P2034" || code === "P2002";
}

function itemTranslationRows(
  gr: string,
  en: string,
  de?: string,
  fr?: string,
  descriptionGr?: string,
) {
  const rows: { language: "GR" | "EN" | "DE" | "FR"; name: string; description: string | null }[] =
    [
      { language: "GR", name: gr, description: descriptionGr ?? null },
      { language: "EN", name: en, description: null },
    ];
  if (de) rows.push({ language: "DE", name: de, description: null });
  if (fr) rows.push({ language: "FR", name: fr, description: null });
  return rows;
}

async function readVenueSeedNeeds(
  db: Prisma.TransactionClient | typeof prisma,
  menuId: string,
  venueId: string,
) {
  const [categoryCount, spotCount, staffCount, paraliaScreen, settings] = await Promise.all([
    db.category.count({ where: { menuId } }),
    db.venueSpot.count({ where: { venueId } }),
    db.venueStaffMember.count({ where: { venueId } }),
    db.venueStationScreen.findFirst({
      where: { venueId, label: ONBOARDING_EXTRA_STATION_SCREEN.label },
      select: { id: true },
    }),
    db.venueSetting.findUnique({
      where: { venueId },
      select: { openingHours: true },
    }),
  ]);

  return {
    needsMenu: categoryCount === 0,
    needsSpots: spotCount === 0,
    needsStaff: staffCount === 0,
    needsParalia: !paraliaScreen,
    needsHours: settings?.openingHours == null,
  };
}

async function seedMenuCategories(tx: Prisma.TransactionClient, menuId: string) {
  let catSort = 0;
  for (const cat of ONBOARDING_STARTER_CATEGORIES) {
    const category = await tx.category.create({
      data: {
        menuId,
        sortOrder: catSort++,
        translations: {
          create: [
            { language: "GR", name: cat.nameGr },
            { language: "EN", name: cat.nameEn },
            ...(cat.nameDe ? [{ language: "DE" as const, name: cat.nameDe }] : []),
            ...(cat.nameFr ? [{ language: "FR" as const, name: cat.nameFr }] : []),
          ],
        },
      },
    });

    let itemSort = 0;
    for (const item of cat.items) {
      await tx.item.create({
        data: {
          categoryId: category.id,
          price: item.price,
          sortOrder: itemSort++,
          available: true,
          photoUrl: ONBOARDING_ITEM_PHOTOS[item.nameGr] ?? null,
          translations: {
            create: itemTranslationRows(
              item.nameGr,
              item.nameEn,
              item.nameDe,
              item.nameFr,
              item.descriptionGr,
            ),
          },
        },
      });
    }
  }
}

async function seedSpots(tx: Prisma.TransactionClient, venueId: string) {
  let spotSort = 0;
  for (const spot of ONBOARDING_STARTER_SPOTS) {
    await tx.venueSpot.create({
      data: {
        venueId,
        type: spot.type,
        label: spot.label,
        sortOrder: spotSort++,
      },
    });
  }
}

async function seedStaff(tx: Prisma.TransactionClient, venueId: string) {
  let staffSort = 0;
  for (const member of ONBOARDING_STARTER_STAFF) {
    await tx.venueStaffMember.create({
      data: {
        venueId,
        name: member.name,
        roleLabel: member.roleLabel,
        stations: member.stations,
        memberToken: randomUUID(),
        sortOrder: staffSort++,
      },
    });
  }
}

async function seedParaliaScreen(tx: Prisma.TransactionClient, venueId: string) {
  const barScreenCount = await tx.venueStationScreen.count({
    where: { venueId, station: ONBOARDING_EXTRA_STATION_SCREEN.station },
  });
  await tx.venueStationScreen.create({
    data: {
      venueId,
      station: ONBOARDING_EXTRA_STATION_SCREEN.station,
      label: ONBOARDING_EXTRA_STATION_SCREEN.label,
      screenToken: randomUUID(),
      sortOrder: barScreenCount,
      spotPrefix: ONBOARDING_EXTRA_STATION_SCREEN.spotPrefix,
    },
  });
}

/** Idempotent starter pack — only fills missing menu, spots, staff, or screens. */
export async function seedOnboardingVenueInTransaction(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    organizationSlug: string;
    venueId: string;
    venueSlug: string;
    menuId: string;
  },
): Promise<boolean> {
  const { organizationId, organizationSlug, venueId, venueSlug, menuId } = params;
  if (!shouldSeedOnboardingVenue(organizationSlug, venueSlug)) return false;

  const needs = await readVenueSeedNeeds(tx, menuId, venueId);
  let { needsMenu, needsSpots, needsStaff, needsParalia, needsHours } = needs;

  if (!needsMenu && !needsSpots && !needsStaff && !needsParalia && !needsHours) {
    return false;
  }

  if (needsMenu) {
    try {
      await assertCanAddItemsInTransaction(tx, organizationId, countOnboardingStarterItems());
    } catch (err) {
      if (err instanceof PlanLimitError) {
        needsMenu = false;
      } else {
        throw err;
      }
    }
  }

  if (!needsMenu && !needsSpots && !needsStaff && !needsParalia && !needsHours) {
    return false;
  }

  if (needsHours) {
    await tx.venueSetting.update({
      where: { venueId },
      data: { openingHours: ONBOARDING_OPENING_HOURS },
    });
  }
  if (needsMenu) await seedMenuCategories(tx, menuId);
  if (needsSpots) await seedSpots(tx, venueId);
  if (needsStaff) await seedStaff(tx, venueId);
  if (needsParalia) await seedParaliaScreen(tx, venueId);

  return true;
}

async function venueNeedsOnboardingSeed(params: {
  organizationSlug: string;
  venueId: string;
  venueSlug: string;
  menuId: string;
}): Promise<boolean> {
  if (!shouldSeedOnboardingVenue(params.organizationSlug, params.venueSlug)) return false;
  const needs = await readVenueSeedNeeds(prisma, params.menuId, params.venueId);
  return needs.needsMenu || needs.needsSpots || needs.needsStaff || needs.needsParalia || needs.needsHours;
}

/** Backfill empty venues for one organization (e.g. on dashboard load). */
export async function ensureOnboardingVenuesForOrganization(organizationId: string): Promise<number> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      slug: true,
      venues: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          slug: true,
          menus: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });
  if (!org) return 0;

  let seeded = 0;
  for (const venue of org.venues) {
    const menuId = venue.menus[0]?.id;
    if (!menuId) continue;

    const params = {
      organizationId,
      organizationSlug: org.slug,
      venueId: venue.id,
      venueSlug: venue.slug,
      menuId,
    };

    if (!(await venueNeedsOnboardingSeed(params))) continue;

    try {
      const didSeed = await prisma.$transaction(
        async (tx) => seedOnboardingVenueInTransaction(tx, params),
        serializableTransaction,
      );
      if (didSeed) seeded += 1;
    } catch (err) {
      if (isRetryableSeedError(err)) continue;
      console.error("[onboarding-seed] failed for venue", venue.id, err);
    }
  }
  return seeded;
}
