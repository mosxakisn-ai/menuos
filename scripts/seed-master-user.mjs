#!/usr/bin/env node
/**
 * Creates or refreshes a master test account (ADMIN + active PRO subscription + demo venue).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-master-user.mjs
 *
 * Optional env:
 *   SEED_MASTER_EMAIL, SEED_MASTER_PASSWORD, SEED_MASTER_NAME, SEED_BUSINESS_NAME
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
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

const email = (process.env.SEED_MASTER_EMAIL ?? "mosxakisn@gmail.com").trim().toLowerCase();
const password = process.env.SEED_MASTER_PASSWORD ?? "MenuOS-Master-2026!";
const name = process.env.SEED_MASTER_NAME ?? "MenuOS Master";
const businessName = process.env.SEED_BUSINESS_NAME ?? "MenuOS Demo";
const orgSlug = "menuos-master";
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

const DEMO_CATEGORIES = [
  {
    nameGr: "Σαλάτες",
    nameEn: "Salads",
    nameDe: "Salate",
    nameFr: "Salades",
    items: [
      {
        nameGr: "Χωριάτικη",
        nameEn: "Greek salad",
        nameDe: "Griechischer Salat",
        nameFr: "Salade grecque",
        price: 9.5,
        descriptionGr: "Ντομάτα, αγγούρι, φέτα",
      },
      {
        nameGr: "Ρόκα",
        nameEn: "Rocket salad",
        nameDe: "Rucolasalat",
        nameFr: "Salade de roquette",
        price: 8.0,
      },
    ],
  },
  {
    nameGr: "Κυρίως πιάτα",
    nameEn: "Mains",
    nameDe: "Hauptgerichte",
    nameFr: "Plats",
    items: [
      {
        nameGr: "Μουσακάς",
        nameEn: "Moussaka",
        nameDe: "Moussaka",
        nameFr: "Moussaka",
        price: 12.0,
        descriptionGr: "Κλασική συνταγή",
      },
      {
        nameGr: "Σουβλάκι χοιρινό",
        nameEn: "Pork souvlaki",
        nameDe: "Schweine-Souvlaki",
        nameFr: "Souvlaki porc",
        price: 10.5,
      },
      {
        nameGr: "Ψητή τσιπούρα",
        nameEn: "Grilled sea bream",
        nameDe: "Gebratene Dorade",
        nameFr: "Daurade grillée",
        price: 18.0,
      },
    ],
  },
  {
    nameGr: "Ποτά",
    nameEn: "Drinks",
    nameDe: "Getränke",
    nameFr: "Boissons",
    items: [
      {
        nameGr: "Μπύρα",
        nameEn: "Beer",
        nameDe: "Bier",
        nameFr: "Bière",
        price: 4.5,
      },
      {
        nameGr: "Κρασί κόκκινο (ποτήρι)",
        nameEn: "Red wine (glass)",
        nameDe: "Rotwein (Glas)",
        nameFr: "Vin rouge (verre)",
        price: 5.0,
      },
    ],
  },
];

function translationRows(gr, en, de, fr, descriptionGr) {
  const rows = [
    { language: "GR", name: gr, description: descriptionGr ?? null },
    { language: "EN", name: en, description: null },
  ];
  if (de) rows.push({ language: "DE", name: de, description: null });
  if (fr) rows.push({ language: "FR", name: fr, description: null });
  return rows;
}

async function ensureDemoMenu(venueId, menuId) {
  const existing = await prisma.category.count({ where: { menuId } });
  if (existing > 0) return;

  let catSort = 0;
  for (const cat of DEMO_CATEGORIES) {
    const category = await prisma.category.create({
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
      await prisma.item.create({
        data: {
          categoryId: category.id,
          price: item.price,
          sortOrder: itemSort++,
          available: true,
          photoUrl: DEMO_PHOTOS[item.nameGr] ?? null,
          translations: {
            create: translationRows(
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

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, name, role: "ADMIN" },
    });

    await prisma.subscription.upsert({
      where: { organizationId: existingUser.organizationId },
      create: {
        organizationId: existingUser.organizationId,
        plan: "PRO",
        status: "ACTIVE",
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
      },
      update: {
        plan: "PRO",
        status: "ACTIVE",
        trialEndsAt: null,
        currentPeriodEnd: periodEnd,
      },
    });

    let venue = await prisma.venue.findFirst({
      where: { organizationId: existingUser.organizationId, slug: venueSlug },
      include: { menus: true },
    });

    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          organizationId: existingUser.organizationId,
          name: "Demo Taverna",
          slug: venueSlug,
          description: "Demo venue για δοκιμές QR menu",
          settings: { create: { brandName: "Demo Taverna" } },
          menus: { create: { name: "Κύριο Menu", type: "RESTAURANT" } },
        },
        include: { menus: true },
      });
    }

    const menu = venue.menus[0];
    if (menu) await ensureDemoMenu(venue.id, menu.id);

    console.log(JSON.stringify({
      action: "updated",
      email,
      password,
      loginUrl: "https://menuos.gr/login",
      dashboardUrl: "https://menuos.gr/dashboard",
      publicMenuUrl: `https://menuos.gr/m/${venueSlug}?table=5&lang=gr`,
      organizationId: existingUser.organizationId,
      plan: "PRO",
    }, null, 2));
    return;
  }

  const organization = await prisma.organization.create({
    data: {
      name: businessName,
      slug: orgSlug,
      subscription: {
        create: {
          plan: "PRO",
          status: "ACTIVE",
          trialEndsAt: null,
          currentPeriodEnd: periodEnd,
        },
      },
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
        },
      },
      venues: {
        create: {
          name: "Demo Taverna",
          slug: venueSlug,
          description: "Demo venue για δοκιμές QR menu",
          settings: { create: { brandName: "Demo Taverna" } },
          menus: { create: { name: "Κύριο Menu", type: "RESTAURANT" } },
        },
      },
    },
    include: {
      users: true,
      venues: { include: { menus: true } },
    },
  });

  const venue = organization.venues[0];
  const menu = venue?.menus[0];
  if (menu) await ensureDemoMenu(venue.id, menu.id);

  console.log(JSON.stringify({
    action: "created",
    email,
    password,
    loginUrl: "https://menuos.gr/login",
    dashboardUrl: "https://menuos.gr/dashboard",
    publicMenuUrl: `https://menuos.gr/m/${venueSlug}?table=5&lang=gr`,
    organizationId: organization.id,
    plan: "PRO",
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
