#!/usr/bin/env node
/** Prints SQL to seed master user — pipe to psql. No DB connection required. */
import { randomBytes } from "node:crypto";

const email = (process.env.SEED_MASTER_EMAIL ?? "mosxakisn@gmail.com").trim().toLowerCase();
const password = process.env.SEED_MASTER_PASSWORD ?? "MenuOS-Master-2026!";
const name = process.env.SEED_MASTER_NAME ?? "MenuOS Master";
const businessName = process.env.SEED_BUSINESS_NAME ?? "MenuOS Demo";
const orgSlug = "menuos-master";
const venueSlug = "demo-taverna";

/** bcrypt hash for default password (rounds=12). Regenerate with scripts/seed-master-user.mjs locally. */
const DEFAULT_PASSWORD_HASH =
  process.env.SEED_MASTER_PASSWORD_HASH ??
  "$2a$12$9EiLcYERNwu2il7FeQZzjeqN18NT9A0lG4bC0veLdPsTLydtcQPyC";

function cuid() {
  const t = Date.now().toString(36);
  const r = randomBytes(6).toString("hex");
  return `cm${t}${r}`.slice(0, 25);
}

const passwordHash = DEFAULT_PASSWORD_HASH;
const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
const orgId = cuid();
const userId = cuid();
const subId = cuid();
const venueId = cuid();
const settingsId = cuid();
const menuId = cuid();

const categories = [
  { gr: "Σαλάτες", en: "Salads", items: [
    ["Χωριάτικη", "Greek salad", 9.5],
    ["Ρόκα", "Rocket salad", 8.0],
  ]},
  { gr: "Κυρίως πιάτα", en: "Mains", items: [
    ["Μουσακάς", "Moussaka", 12.0],
    ["Σουβλάκι χοιρινό", "Pork souvlaki", 10.5],
    ["Ψητή τσιπούρα", "Grilled sea bream", 18.0],
  ]},
  { gr: "Ποτά", en: "Drinks", items: [
    ["Μπύρα", "Beer", 4.5],
    ["Κρασί κόκκινο (ποτήρι)", "Red wine (glass)", 5.0],
  ]},
];

function esc(s) {
  return s.replace(/'/g, "''");
}

console.log(`-- MenuOS master seed for ${email}`);
console.log("BEGIN;");

console.log(`
DELETE FROM "WaiterCall" WHERE "venueId" IN (
  SELECT id FROM "Venue" WHERE slug = '${venueSlug}'
);
DELETE FROM "ItemTranslation" WHERE "itemId" IN (
  SELECT i.id FROM "Item" i
  JOIN "Category" c ON c.id = i."categoryId"
  JOIN "Menu" m ON m.id = c."menuId"
  JOIN "Venue" v ON v.id = m."venueId"
  WHERE v.slug = '${venueSlug}'
);
DELETE FROM "Item" WHERE "categoryId" IN (
  SELECT c.id FROM "Category" c
  JOIN "Menu" m ON m.id = c."menuId"
  JOIN "Venue" v ON v.id = m."venueId"
  WHERE v.slug = '${venueSlug}'
);
DELETE FROM "CategoryTranslation" WHERE "categoryId" IN (
  SELECT c.id FROM "Category" c
  JOIN "Menu" m ON m.id = c."menuId"
  JOIN "Venue" v ON v.id = m."venueId"
  WHERE v.slug = '${venueSlug}'
);
DELETE FROM "Category" WHERE "menuId" IN (
  SELECT m.id FROM "Menu" m JOIN "Venue" v ON v.id = m."venueId" WHERE v.slug = '${venueSlug}'
);
DELETE FROM "Menu" WHERE "venueId" IN (SELECT id FROM "Venue" WHERE slug = '${venueSlug}');
DELETE FROM "VenueSetting" WHERE "venueId" IN (SELECT id FROM "Venue" WHERE slug = '${venueSlug}');
DELETE FROM "Venue" WHERE slug = '${venueSlug}';
DELETE FROM "User" WHERE email = '${esc(email)}';
DELETE FROM "Subscription" WHERE "organizationId" IN (SELECT id FROM "Organization" WHERE slug = '${orgSlug}');
DELETE FROM "Organization" WHERE slug = '${orgSlug}';
`);

console.log(`
INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt")
VALUES ('${orgId}', '${esc(businessName)}', '${orgSlug}', NOW(), NOW());

INSERT INTO "Subscription" (id, "organizationId", plan, status, "trialEndsAt", "currentPeriodEnd", "createdAt", "updatedAt")
VALUES ('${subId}', '${orgId}', 'PRO', 'ACTIVE', NULL, '${periodEnd}', NOW(), NOW());

INSERT INTO "User" (id, "organizationId", name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES ('${userId}', '${orgId}', '${esc(name)}', '${esc(email)}', '${passwordHash}', 'ADMIN', NOW(), NOW());

INSERT INTO "Venue" (id, "organizationId", name, slug, description, "primaryColor", "secondaryColor", "createdAt", "updatedAt")
VALUES ('${venueId}', '${orgId}', 'Demo Taverna', '${venueSlug}', 'Demo venue για δοκιμές QR menu', '#2563EB', '#06B6D4', NOW(), NOW());

INSERT INTO "VenueSetting" (id, "venueId", "brandName", "createdAt", "updatedAt")
VALUES ('${settingsId}', '${venueId}', 'Demo Taverna', NOW(), NOW());

INSERT INTO "Menu" (id, "venueId", name, type, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES ('${menuId}', '${venueId}', 'Κύριο Menu', 'RESTAURANT', 0, true, NOW(), NOW());
`);

let catSort = 0;
for (const cat of categories) {
  const catId = cuid();
  console.log(`
INSERT INTO "Category" (id, "menuId", "sortOrder", "createdAt", "updatedAt")
VALUES ('${catId}', '${menuId}', ${catSort++}, NOW(), NOW());
INSERT INTO "CategoryTranslation" (id, "categoryId", language, name)
VALUES ('${cuid()}', '${catId}', 'GR', '${esc(cat.gr)}'), ('${cuid()}', '${catId}', 'EN', '${esc(cat.en)}');
`);
  let itemSort = 0;
  for (const [gr, en, price] of cat.items) {
    const itemId = cuid();
    console.log(`
INSERT INTO "Item" (id, "categoryId", price, available, "sortOrder", "createdAt", "updatedAt")
VALUES ('${itemId}', '${catId}', ${price}, true, ${itemSort++}, NOW(), NOW());
INSERT INTO "ItemTranslation" (id, "itemId", language, name)
VALUES ('${cuid()}', '${itemId}', 'GR', '${esc(gr)}'), ('${cuid()}', '${itemId}', 'EN', '${esc(en)}');
`);
  }
}

console.log("COMMIT;");
console.error(`\nMaster user ready:\n  email: ${email}\n  password: ${password}\n  login: https://menuos.gr/login\n  QR menu: https://menuos.gr/m/${venueSlug}?table=5`);
