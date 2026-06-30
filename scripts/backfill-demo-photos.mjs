#!/usr/bin/env node
/**
 * Adds demo food photos to demo-taverna items (mains & salads only).
 * Drinks stay as compact list rows without photos.
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
    // optional .env
  }
}

loadDotEnv();

const prisma = new PrismaClient();
const venueSlug = "demo-taverna";

const DEMO_PHOTOS = {
  "Χωριάτικη":
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  Ρόκα: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  Μουσακάς:
    "https://images.unsplash.com/photo-1604908176997-431836457af9?auto=format&fit=crop&w=800&q=80",
  "Σουβλάκι χοιρινό":
    "https://images.unsplash.com/photo-1529006557810-274b1b4c8577?auto=format&fit=crop&w=800&q=80",
  "Ψητή τσιπούρα":
    "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=800&q=80",
};

async function main() {
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              items: { include: { translations: true } },
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
  for (const menu of venue.menus) {
    for (const category of menu.categories) {
      for (const item of category.items) {
        const nameGr = item.translations.find((t) => t.language === "GR")?.name;
        const photo = nameGr ? DEMO_PHOTOS[nameGr] : undefined;
        if (!photo) continue;
        if (item.photoUrl === photo) continue;
        await prisma.item.update({
          where: { id: item.id },
          data: { photoUrl: photo },
        });
        updated++;
      }
    }
  }

  console.log(JSON.stringify({ ok: true, venueSlug, updated }));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
