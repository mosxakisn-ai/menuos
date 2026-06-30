#!/usr/bin/env node
/**
 * Adds demo food/drink photos to demo-taverna items missing images.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { DEMO_PHOTO_CATEGORY_NAMES, resolveDemoPhoto } from "./lib/demo-photos.mjs";

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
    // optional .env
  }
}

loadDotEnv();

const prisma = new PrismaClient();
const venueSlug = "demo-taverna";

async function main() {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              items: { include: { translations: true } },
              translations: true,
            },
          },
        },
      },
    },
  });

  if (!venue) {
    console.log(JSON.stringify({ ok: false, error: "venue not found" }));
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const menu of venue.menus) {
    for (const category of menu.categories) {
      const catNameGr =
        category.translations.find((t) => t.language === "GR")?.name ?? "";
      const categoryWantsPhotos = DEMO_PHOTO_CATEGORY_NAMES.test(catNameGr);

      for (const item of category.items) {
        const nameGr = item.translations.find((t) => t.language === "GR")?.name;
        const photo = resolveDemoPhoto(nameGr);
        if (!photo) {
          skipped++;
          continue;
        }
        if (!categoryWantsPhotos && !item.photoUrl) {
          skipped++;
          continue;
        }
        if (item.photoUrl === photo) continue;
        await prisma.item.update({
          where: { id: item.id },
          data: { photoUrl: photo },
        });
        updated++;
      }
    }
  }

  console.log(JSON.stringify({ ok: true, venueSlug, updated, skipped }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
