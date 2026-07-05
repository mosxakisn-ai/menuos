#!/usr/bin/env node
/**
 * Clear active waiter calls, pass signals, and staff push subscriptions for fresh testing.
 *
 * Usage:
 *   node scripts/clear-venue-live-data.mjs <venueSlug>
 *   node scripts/clear-venue-live-data.mjs <venueSlug> --history   # also delete delivered/completed rows
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

const slug = process.argv[2]?.trim();
const withHistory = process.argv.includes("--history");

if (!slug) {
  console.error("Usage: node scripts/clear-venue-live-data.mjs <venueSlug> [--history]");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const venue = await prisma.venue.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
  if (!venue) {
    console.error(`Venue not found: ${slug}`);
    process.exit(1);
  }

  const activeCallStatuses = withHistory
    ? undefined
    : { in: ["PENDING", "ACKNOWLEDGED"] };
  const activePassStatuses = withHistory
    ? undefined
    : { in: ["READY", "PICKED_UP"] };

  const [calls, passes, push] = await prisma.$transaction([
    prisma.waiterCall.deleteMany({
      where: {
        venueId: venue.id,
        ...(activeCallStatuses ? { status: activeCallStatuses } : {}),
      },
    }),
    prisma.passSignal.deleteMany({
      where: {
        venueId: venue.id,
        ...(activePassStatuses ? { status: activePassStatuses } : {}),
      },
    }),
    prisma.pushSubscription.deleteMany({
      where: {
        OR: [
          { venueId: venue.id },
          { staffMember: { venueId: venue.id } },
        ],
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        venue: venue.name,
        slug,
        deletedWaiterCalls: calls.count,
        deletedPassSignals: passes.count,
        deletedPushSubscriptions: push.count,
        scope: withHistory ? "all-history" : "active-only",
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
