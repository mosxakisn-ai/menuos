#!/usr/bin/env node
/**
 * Fill demo / showcase venues with sample staff, spots, pass signals, and waiter calls.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-demo-showcase.mjs
 *
 * Env:
 *   SEED_VENUE_SLUG       — single venue (default: demo-taverna)
 *   SEED_ALL_VENUES=1     — every venue in the same org as demo-taverna
 *   SEED_REFRESH=1        — clear active calls/signals before seeding (demo-taverna only unless ALL)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

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

const DEFAULT_SLUG = "demo-taverna";
const REFRESH = process.env.SEED_REFRESH === "1";
const SEED_ALL = process.env.SEED_ALL_VENUES === "1";
const SINGLE_SLUG = (process.env.SEED_VENUE_SLUG ?? DEFAULT_SLUG).trim();

const STAFF = [
  { name: "Μαρία Π.", roleLabel: "Σερβιτόρος", stations: ["services"] },
  { name: "Γιώργος Κ.", roleLabel: "Σερβιτόρος", stations: ["services"] },
  { name: "Σοφία Λ.", roleLabel: "Σερβιτόρος παραλίας", stations: ["services", "bar"] },
  { name: "Νίκος Α.", roleLabel: "Μάγειρας", stations: ["kitchen"] },
  { name: "Ελένη Μ.", roleLabel: "Μπαρ", stations: ["bar"] },
  { name: "Άννα Κ.", roleLabel: "Μπαρ παραλίας", stations: ["bar"] },
  { name: "Πέτρος Δ.", roleLabel: "Κρύα κουζίνα", stations: ["cold"] },
  { name: "Κώστας Δ.", roleLabel: "Manager", stations: ["all"] },
];

const PASS_ACTIVE = [
  { station: "KITCHEN", table: "8", message: "2 μουσακάς — έλα πάσο", screenLabel: "Κουζίνα", minutesAgo: 2, status: "READY" },
  { station: "BAR", table: "5", message: "Ξέχασες τον πάγο", screenLabel: "Μπαρ", minutesAgo: 4, status: "READY" },
  { station: "BAR", table: "Αυλή-2", message: "2 μπύρες — παραλία", screenLabel: "Παραλία", minutesAgo: 3, status: "READY" },
  { station: "COLD", table: "12", message: "Χωριάτικη έτοιμη", screenLabel: "Κρύα", minutesAgo: 5, status: "READY" },
  { station: "DESSERT", table: "7", message: "Παγωτό παρφέ", screenLabel: "Γλυκά", minutesAgo: 6, status: "READY" },
  { station: "KITCHEN", table: "Όροφος-1", message: "Σουβλάκι — πήρα", screenLabel: "Κουζίνα", minutesAgo: 1, status: "PICKED_UP" },
];

const PASS_HISTORY = [
  { station: "KITCHEN", table: "12", message: "Σουβλάκι", hoursAgo: 2, deliveryMins: 3 },
  { station: "BAR", table: "5", message: "Κρασί λευκό", hoursAgo: 5, deliveryMins: 2 },
  { station: "BAR", table: "Αυλή-1", message: "Φραπέ παραλίας", hoursAgo: 8, deliveryMins: 4, screenLabel: "Παραλία" },
  { station: "DESSERT", table: "9", message: "Γαλακτομπούρεκο", hoursAgo: 24, deliveryMins: 5 },
  { station: "COLD", table: "3", message: "Τζατζίκι + πίτα", hoursAgo: 3, deliveryMins: 2 },
  { station: "KITCHEN", table: "Όροφος-2", message: "Ψητή τσιπούρα", hoursAgo: 12, deliveryMins: 6 },
  { station: "BAR", table: "10", message: "Μοχίτο x2", hoursAgo: 48, deliveryMins: 3, screenLabel: "Μπαρ" },
  { station: "DESSERT", table: "Αυλή-3", message: "Μπακλαβάς", hoursAgo: 72, deliveryMins: 4 },
];

const WAITER_CALLS = [
  { type: "WAITER", table: "11" },
  { type: "BILL", table: "5" },
  {
    type: "ORDER",
    table: "8",
    status: "PENDING",
    orderItems: {
      lines: [
        { name: "Μουσακάς", qty: 2, unitPrice: "12.00", lineTotal: "24.00", detail: null },
        { name: "Χωριάτικη", qty: 1, unitPrice: "9.50", lineTotal: "9.50", detail: null },
      ],
      total: "33.50",
    },
  },
  { type: "WAITER", table: "Αυλή-2" },
  { type: "BILL", table: "Όροφος-1", status: "ACKNOWLEDGED" },
  { type: "WAITER", sunbed: "paralia-1" },
  { type: "BILL", room: "101" },
];

/** Spots always upserted — not skipped when venue already has tables. */
const SPOT_ROWS = [
  ...Array.from({ length: 12 }, (_, i) => ({ type: "TABLE", label: String(i + 1) })),
  { type: "TABLE", label: "Αυλή-1" },
  { type: "TABLE", label: "Αυλή-2" },
  { type: "TABLE", label: "Αυλή-3" },
  { type: "TABLE", label: "Όροφος-1" },
  { type: "TABLE", label: "Όροφος-2" },
  { type: "TABLE", label: "Όροφος-3" },
  { type: "SUNBED", label: "paralia-1" },
  { type: "SUNBED", label: "paralia-2" },
  { type: "SUNBED", label: "paralia-3" },
  { type: "ROOM", label: "101" },
  { type: "ROOM", label: "102" },
];

async function resolveVenueSlugs() {
  if (!SEED_ALL) return [SINGLE_SLUG];
  const anchor = await prisma.venue.findUnique({
    where: { slug: DEFAULT_SLUG },
    select: { organizationId: true },
  });
  if (!anchor) return [SINGLE_SLUG];
  const venues = await prisma.venue.findMany({
    where: { organizationId: anchor.organizationId },
    select: { slug: true },
    orderBy: { createdAt: "asc" },
  });
  return venues.map((v) => v.slug);
}

async function ensureSpots(venueId) {
  let sort = 0;
  for (const row of SPOT_ROWS) {
    await prisma.venueSpot.upsert({
      where: { venueId_type_label: { venueId, type: row.type, label: row.label } },
      create: { venueId, type: row.type, label: row.label, sortOrder: sort++ },
      update: { sortOrder: sort++ },
    });
  }
  return SPOT_ROWS.length;
}

async function ensureVenueSettings(venueId, venueName) {
  await prisma.venueSetting.upsert({
    where: { venueId },
    create: {
      venueId,
      brandName: venueName,
      openingHours: {
        mon: "12:00–00:00",
        tue: "12:00–00:00",
        wed: "12:00–00:00",
        thu: "12:00–00:00",
        fri: "12:00–01:00",
        sat: "12:00–01:00",
        sun: "12:00–00:00",
      },
    },
    update: {},
  });
}

async function ensureStationScreens(venueId) {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      kitchenScreenToken: true,
      barScreenToken: true,
      coldScreenToken: true,
      dessertScreenToken: true,
    },
  });
  if (!venue) return [];

  const legacyTokens = {
    KITCHEN: venue.kitchenScreenToken,
    BAR: venue.barScreenToken,
    COLD: venue.coldScreenToken,
    DESSERT: venue.dessertScreenToken,
  };

  const stations = [
    { station: "KITCHEN", label: "Κουζίνα", spotPrefix: null },
    { station: "BAR", label: "Μπαρ", spotPrefix: null },
    { station: "BAR", label: "Παραλία", spotPrefix: "Αυλή" },
    { station: "COLD", label: "Κρύα", spotPrefix: null },
    { station: "DESSERT", label: "Γλυκά", spotPrefix: null },
  ];

  for (const { station, label, spotPrefix } of stations) {
    const found = await prisma.venueStationScreen.findFirst({
      where: { venueId, station, label },
    });
    if (!found) {
      const count = await prisma.venueStationScreen.count({ where: { venueId, station } });
      await prisma.venueStationScreen.create({
        data: {
          venueId,
          station,
          label,
          screenToken: count === 0 ? legacyTokens[station] : randomUUID(),
          sortOrder: count,
          spotPrefix,
        },
      });
    } else if (spotPrefix && found.spotPrefix !== spotPrefix) {
      await prisma.venueStationScreen.update({
        where: { id: found.id },
        data: { spotPrefix },
      });
    }
  }

  return prisma.venueStationScreen.findMany({
    where: { venueId },
    select: { id: true, station: true, label: true, screenToken: true },
  });
}

async function ensureStaff(venueId) {
  const count = await prisma.venueStaffMember.count({ where: { venueId } });
  if (count > 0 && !REFRESH) return count;

  if (REFRESH) {
    await prisma.venueStaffMember.deleteMany({ where: { venueId } });
  }

  let sort = 0;
  for (const row of STAFF) {
    await prisma.venueStaffMember.create({
      data: {
        venueId,
        name: row.name,
        roleLabel: row.roleLabel,
        stations: row.stations,
        memberToken: randomUUID(),
        sortOrder: sort++,
      },
    });
  }
  return STAFF.length;
}

async function clearActive(venueId, slug) {
  const canRefresh = REFRESH && (slug === DEFAULT_SLUG || SEED_ALL);
  if (!canRefresh) return;

  await prisma.passSignal.deleteMany({
    where: {
      venueId,
      OR: [
        { status: { in: ["READY", "PICKED_UP"] } },
        {
          status: "DELIVERED",
          deliveredAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60_000) },
        },
      ],
    },
  });
  await prisma.waiterCall.deleteMany({
    where: { venueId, status: { in: ["PENDING", "ACKNOWLEDGED"] } },
  });
}

async function seedPassSignals(venueId, screens) {
  const screenByKey = new Map(
    screens.map((s) => [`${s.station}:${s.label}`, s.id]),
  );

  for (const row of PASS_ACTIVE) {
    const readyAt = new Date(Date.now() - row.minutesAgo * 60_000);
    const screenId = row.screenLabel
      ? screenByKey.get(`${row.station}:${row.screenLabel}`) ?? null
      : null;
    const status = row.status ?? "READY";
    await prisma.passSignal.create({
      data: {
        venueId,
        station: row.station,
        stationScreenId: screenId,
        tableNumber: row.table ?? undefined,
        roomNumber: row.room ?? undefined,
        sunbedNumber: row.sunbed ?? undefined,
        message: row.message,
        status,
        readyAt,
        ...(status === "PICKED_UP" ? { pickedUpAt: new Date(readyAt.getTime() + 30_000) } : {}),
      },
    });
  }

  for (const row of PASS_HISTORY) {
    const readyAt = new Date(Date.now() - row.hoursAgo * 60 * 60_000);
    const deliveredAt = new Date(readyAt.getTime() + row.deliveryMins * 60_000);
    const screenId = row.screenLabel
      ? screenByKey.get(`${row.station}:${row.screenLabel}`) ?? null
      : null;
    await prisma.passSignal.create({
      data: {
        venueId,
        station: row.station,
        stationScreenId: screenId,
        tableNumber: row.table,
        message: row.message,
        status: "DELIVERED",
        readyAt,
        deliveredAt,
        pickedUpAt: new Date(readyAt.getTime() + 60_000),
      },
    });
  }
}

async function seedWaiterCalls(venueId) {
  for (const row of WAITER_CALLS) {
    await prisma.waiterCall.create({
      data: {
        venueId,
        type: row.type,
        tableNumber: row.table ?? undefined,
        roomNumber: row.room ?? undefined,
        sunbedNumber: row.sunbed ?? undefined,
        status: row.status ?? "PENDING",
        orderItems: row.orderItems ?? undefined,
      },
    });
  }
}

async function seedVenue(slug) {
  const venue = await prisma.venue.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!venue) {
    return { slug, ok: false, error: "venue not found" };
  }

  await clearActive(venue.id, slug);
  await ensureVenueSettings(venue.id, venue.name);
  const spots = await ensureSpots(venue.id);
  const screens = await ensureStationScreens(venue.id);
  const staff = await ensureStaff(venue.id);
  await seedPassSignals(venue.id, screens);
  await seedWaiterCalls(venue.id);

  return {
    slug,
    ok: true,
    name: venue.name,
    spots,
    screens: screens.length,
    staff,
    passActive: PASS_ACTIVE.length,
    passHistory: PASS_HISTORY.length,
    waiterCalls: WAITER_CALLS.length,
  };
}

async function main() {
  const slugs = await resolveVenueSlugs();
  const results = [];
  for (const slug of slugs) {
    results.push(await seedVenue(slug));
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        refresh: REFRESH,
        allVenues: SEED_ALL,
        showcasePauseHint:
          "Set DEMO_SHOWCASE_UNTIL in .env (ISO date) to pause demo waiter-call cleanup.",
        results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
