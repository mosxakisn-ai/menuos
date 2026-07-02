#!/usr/bin/env node
/**
 * Backfill onboarding starter data for customer venues created before auto-seed shipped.
 * Skips demo-taverna and menuos-master. Idempotent — only fills empty menu/spots/staff.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/backfill-onboarding-venues.mjs
 *
 * Optional:
 *   DRY_RUN=1 — list venues that would be seeded, no writes
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  ONBOARDING_EXTRA_STATION_SCREEN,
  ONBOARDING_ITEM_PHOTOS,
  ONBOARDING_OPENING_HOURS,
  ONBOARDING_STARTER_CATEGORIES,
  ONBOARDING_STARTER_SPOTS,
  ONBOARDING_STARTER_STAFF,
  shouldSeedOnboardingVenue,
} from "./lib/onboarding-starter-data.mjs";
import { randomUUID } from "node:crypto";

function loadDotEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadDotEnv();

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

function itemTranslationRows(gr, en, de, fr, descriptionGr) {
  const rows = [
    { language: "GR", name: gr, description: descriptionGr ?? null },
    { language: "EN", name: en, description: null },
  ];
  if (de) rows.push({ language: "DE", name: de, description: null });
  if (fr) rows.push({ language: "FR", name: fr, description: null });
  return rows;
}

async function needsSeed(tx, { organizationSlug, venueId, venueSlug, menuId }) {
  if (!shouldSeedOnboardingVenue(organizationSlug, venueSlug)) return false;

  const [categoryCount, spotCount, staffCount, paraliaScreen, settings] = await Promise.all([
    tx.category.count({ where: { menuId } }),
    tx.venueSpot.count({ where: { venueId } }),
    tx.venueStaffMember.count({ where: { venueId } }),
    tx.venueStationScreen.findFirst({
      where: { venueId, label: ONBOARDING_EXTRA_STATION_SCREEN.label },
      select: { id: true },
    }),
    tx.venueSetting.findUnique({ where: { venueId }, select: { openingHours: true } }),
  ]);

  return (
    categoryCount === 0 ||
    spotCount === 0 ||
    staffCount === 0 ||
    !paraliaScreen ||
    settings?.openingHours == null
  );
}

async function seedVenue(tx, { organizationSlug, venueId, venueSlug, menuId }) {
  if (!(await needsSeed(tx, { organizationSlug, venueId, venueSlug, menuId }))) return false;

  const [categoryCount, spotCount, staffCount, paraliaScreen, settings] = await Promise.all([
    tx.category.count({ where: { menuId } }),
    tx.venueSpot.count({ where: { venueId } }),
    tx.venueStaffMember.count({ where: { venueId } }),
    tx.venueStationScreen.findFirst({
      where: { venueId, label: ONBOARDING_EXTRA_STATION_SCREEN.label },
      select: { id: true },
    }),
    tx.venueSetting.findUnique({ where: { venueId }, select: { openingHours: true } }),
  ]);

  if (settings?.openingHours == null) {
    await tx.venueSetting.update({
      where: { venueId },
      data: { openingHours: ONBOARDING_OPENING_HOURS },
    });
  }

  if (categoryCount === 0) {
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
              ...(cat.nameDe ? [{ language: "DE", name: cat.nameDe }] : []),
              ...(cat.nameFr ? [{ language: "FR", name: cat.nameFr }] : []),
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

  if (spotCount === 0) {
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

  if (staffCount === 0) {
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

  if (!paraliaScreen) {
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

  return true;
}

async function main() {
  const venues = await prisma.venue.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      organization: { select: { slug: true } },
      menus: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } },
    },
  });

  let candidates = 0;
  let seeded = 0;

  for (const venue of venues) {
    const menuId = venue.menus[0]?.id;
    if (!menuId) continue;
    if (!shouldSeedOnboardingVenue(venue.organization.slug, venue.slug)) continue;

    const pending = await needsSeed(prisma, {
      organizationSlug: venue.organization.slug,
      venueId: venue.id,
      venueSlug: venue.slug,
      menuId,
    });
    if (!pending) continue;

    candidates += 1;
    const label = `${venue.organization.slug}/${venue.slug}`;
    if (DRY_RUN) {
      console.log(`would seed: ${label}`);
      continue;
    }

    const didSeed = await prisma.$transaction(async (tx) =>
      seedVenue(tx, {
        organizationSlug: venue.organization.slug,
        venueId: venue.id,
        venueSlug: venue.slug,
        menuId,
      }),
    );
    if (didSeed) {
      seeded += 1;
      console.log(`seeded: ${label}`);
    }
  }

  console.log(
    DRY_RUN
      ? `DRY_RUN — ${candidates} venue(s) need onboarding data.`
      : `Done — seeded ${seeded} of ${candidates} venue(s).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
