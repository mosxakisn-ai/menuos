#!/usr/bin/env npx tsx
/**
 * Re-sanitize venue staff post assignments after logic changes.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/backfill-staff-assignments.ts
 *
 * Optional:
 *   DRY_RUN=1 — list changes without writing
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  const { resanitizeAllVenueStaffAssignments } = await import(
    "../apps/web/src/lib/venue-operations-config-service.ts"
  );

  const result = await resanitizeAllVenueStaffAssignments({ dryRun: DRY_RUN });
  for (const change of result.changes) {
    console.log(
      `${DRY_RUN ? "[dry-run] " : ""}venue=${change.venueId} member=${change.memberId}: ${JSON.stringify(change.from)} → ${JSON.stringify(change.to)}`,
    );
  }
  console.log(
    `${DRY_RUN ? "Would update" : "Updated"} ${result.updated} member(s) across ${result.venues} venue(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
