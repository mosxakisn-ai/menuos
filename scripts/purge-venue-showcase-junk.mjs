#!/usr/bin/env node
/**
 * Remove demo/onboarding junk (paralia, Όροφος) and orphan active live calls.
 *
 * Usage:
 *   node scripts/purge-venue-showcase-junk.mjs <venueSlug>
 *   node scripts/purge-venue-showcase-junk.mjs --all-customers
 *   node scripts/purge-venue-showcase-junk.mjs <venueSlug> --include-auli
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function norm(label) {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function isJunkSpotLabel(label, includeAuli) {
  const raw = label.trim();
  if (!raw) return false;
  const n = norm(raw);
  if (/^paralia-/.test(n)) return true;
  if (/^orofos-/.test(n) || /^οροφος-/.test(n)) return true;
  if (includeAuli && (/^αυλη-/.test(n) || /^auli-/.test(n))) return true;
  return false;
}

function isJunkScreenLabel(label) {
  const n = norm(label);
  return n === "παραλια" || n === "paralia";
}

function isJunkLocation(loc, includeAuli) {
  if (loc.sunbedNumber && isJunkSpotLabel(loc.sunbedNumber, includeAuli)) return true;
  if (loc.tableNumber && isJunkSpotLabel(loc.tableNumber, includeAuli)) return true;
  if (loc.roomNumber && isJunkSpotLabel(loc.roomNumber, includeAuli)) return true;
  return false;
}

function normalizeTable(value) {
  const t = value.trim();
  if (/^\d+$/.test(t)) return String(Number.parseInt(t, 10));
  return t;
}

function locationMatchesSpot(spot, loc) {
  if (loc.sunbedNumber?.trim()) {
    return spot.type === "SUNBED" && spot.label.trim() === loc.sunbedNumber.trim();
  }
  if (loc.roomNumber?.trim()) {
    return spot.type === "ROOM" && spot.label.trim() === loc.roomNumber.trim();
  }
  if (loc.tableNumber?.trim()) {
    return (
      spot.type === "TABLE" &&
      normalizeTable(spot.label) === normalizeTable(loc.tableNumber)
    );
  }
  return false;
}

const args = process.argv.slice(2);
const allCustomers = args.includes("--all-customers");
const includeAuli = args.includes("--include-auli");
const slugArg = args.find((a) => !a.startsWith("--"));

const ACTIVE_CALL = new Set(["PENDING", "ACKNOWLEDGED"]);
const ACTIVE_PASS = new Set(["READY", "PICKED_UP"]);

async function purgeVenue(prisma, venue) {
  const spots = await prisma.venueSpot.findMany({
    where: { venueId: venue.id },
    select: { id: true, type: true, label: true },
  });

  const junkSpotIds = spots.filter((s) => isJunkSpotLabel(s.label, includeAuli)).map((s) => s.id);
  const remainingSpots = spots.filter((s) => !junkSpotIds.includes(s.id));

  const screens = await prisma.venueStationScreen.findMany({
    where: { venueId: venue.id },
    select: { id: true, label: true },
  });
  const junkScreenIds = screens.filter((s) => isJunkScreenLabel(s.label)).map((s) => s.id);

  const [allCalls, allPasses] = await Promise.all([
    prisma.waiterCall.findMany({
      where: { venueId: venue.id },
      select: {
        id: true,
        status: true,
        tableNumber: true,
        roomNumber: true,
        sunbedNumber: true,
      },
    }),
    prisma.passSignal.findMany({
      where: { venueId: venue.id },
      select: {
        id: true,
        status: true,
        tableNumber: true,
        roomNumber: true,
        sunbedNumber: true,
      },
    }),
  ]);

  const callIdsToDelete = new Set();
  const passIdsToDelete = new Set();
  const orphanCallLabels = [];
  const orphanPassLabels = [];

  for (const call of allCalls) {
    const loc = {
      tableNumber: call.tableNumber,
      roomNumber: call.roomNumber,
      sunbedNumber: call.sunbedNumber,
    };
    if (isJunkLocation(loc, includeAuli)) {
      callIdsToDelete.add(call.id);
      continue;
    }
    if (
      ACTIVE_CALL.has(call.status) &&
      !remainingSpots.some((spot) => locationMatchesSpot(spot, loc))
    ) {
      callIdsToDelete.add(call.id);
      orphanCallLabels.push(loc.tableNumber || loc.sunbedNumber || loc.roomNumber || call.id);
    }
  }

  for (const pass of allPasses) {
    const loc = {
      tableNumber: pass.tableNumber,
      roomNumber: pass.roomNumber,
      sunbedNumber: pass.sunbedNumber,
    };
    if (isJunkLocation(loc, includeAuli)) {
      passIdsToDelete.add(pass.id);
      continue;
    }
    if (
      ACTIVE_PASS.has(pass.status) &&
      !remainingSpots.some((spot) => locationMatchesSpot(spot, loc))
    ) {
      passIdsToDelete.add(pass.id);
      orphanPassLabels.push(loc.tableNumber || loc.sunbedNumber || loc.roomNumber || pass.id);
    }
  }

  const callIdList = [...callIdsToDelete];
  const passIdList = [...passIdsToDelete];

  const deletedSpots = junkSpotIds.length
    ? await prisma.venueSpot.deleteMany({ where: { id: { in: junkSpotIds } } })
    : { count: 0 };
  const deletedScreens = junkScreenIds.length
    ? await prisma.venueStationScreen.deleteMany({ where: { id: { in: junkScreenIds } } })
    : { count: 0 };
  const deletedCalls = callIdList.length
    ? await prisma.waiterCall.deleteMany({ where: { id: { in: callIdList } } })
    : { count: 0 };
  const deletedPasses = passIdList.length
    ? await prisma.passSignal.deleteMany({ where: { id: { in: passIdList } } })
    : { count: 0 };

  return {
    venue: venue.name,
    slug: venue.slug,
    deletedSpots: deletedSpots.count,
    deletedScreens: deletedScreens.count,
    deletedCalls: deletedCalls.count,
    deletedPasses: deletedPasses.count,
    junkSpotLabels: spots.filter((s) => junkSpotIds.includes(s.id)).map((s) => s.label),
    orphanCallLocations: orphanCallLabels,
    orphanPassLocations: orphanPassLabels,
  };
}

const prisma = new PrismaClient();

try {
  if (!allCustomers && !slugArg) {
    console.error("Usage: node scripts/purge-venue-showcase-junk.mjs <venueSlug> | --all-customers");
    process.exit(1);
  }

  const venues = allCustomers
    ? await prisma.venue.findMany({
        where: {
          slug: { notIn: ["demo-taverna"] },
          organization: { slug: { not: "menuos-master" } },
        },
        select: { id: true, name: true, slug: true },
        orderBy: { slug: "asc" },
      })
    : await prisma.venue
        .findMany({
          where: { slug: slugArg },
          select: { id: true, name: true, slug: true },
        })
        .then((rows) => {
          if (rows.length === 0) throw new Error(`Venue not found: ${slugArg}`);
          return rows;
        });

  const results = [];
  for (const venue of venues) {
    results.push(await purgeVenue(prisma, venue));
  }

  console.log(JSON.stringify({ includeAuli, venues: results.length, results }, null, 2));
} finally {
  await prisma.$disconnect();
}
