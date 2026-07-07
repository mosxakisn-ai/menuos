#!/usr/bin/env npx tsx
/**
 * Συμπληρώνει μεταφράσεις QR menu (9 γλώσσες) για όλους τους οργανισμούς.
 *
 * Usage:
 *   DATABASE_URL=... DEEPL_API_KEY=... npx tsx scripts/backfill-menu-translations.ts
 *
 * Optional:
 *   ORG_ID=<uuid> — μόνο ένας οργανισμός
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "@menuos/db";
import { backfillOrganizationMenuTranslations } from "../apps/web/src/lib/catalog-backfill-translations";

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

async function main() {
  const orgFilter = process.env.ORG_ID?.trim();
  const orgs = orgFilter
    ? await prisma.organization.findMany({ where: { id: orgFilter }, select: { id: true, name: true } })
    : await prisma.organization.findMany({ select: { id: true, name: true } });

  if (orgs.length === 0) {
    console.log("No organizations found.");
    return;
  }

  console.log(`Backfilling menu translations for ${orgs.length} organization(s)...`);

  for (const org of orgs) {
    console.log(`\n→ ${org.name} (${org.id})`);
    const result = await backfillOrganizationMenuTranslations(org.id);
    console.log(
      `  categories: ${result.categoriesUpdated}, items: ${result.itemsUpdated}, api batches: ${result.translationApiCalls}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
