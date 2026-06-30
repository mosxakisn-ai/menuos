#!/usr/bin/env node
/**
 * Re-sign local /api/photos/serve/ URLs stored in Item.photoUrl and Venue.logoUrl.
 */
import { createHmac } from "node:crypto";
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
const PHOTO_PREFIX = "/api/photos/serve/";

function photoSignSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return secret;
}

function photoStorageKeyFromPath(pathname) {
  const idx = pathname.indexOf(PHOTO_PREFIX);
  if (idx < 0) return null;
  const encoded = pathname.slice(idx + PHOTO_PREFIX.length);
  if (!encoded) return null;
  try {
    return encoded.split("/").map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    return null;
  }
}

function signPhotoKey(key) {
  return createHmac("sha256", photoSignSecret()).update(key).digest("base64url");
}

function resignPhotoUrl(url) {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed, "http://localhost");
    const key = photoStorageKeyFromPath(parsed.pathname);
    if (!key) return trimmed;
    parsed.searchParams.set("sig", signPhotoKey(key));
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}

async function main() {
  let itemUpdates = 0;
  let venueUpdates = 0;

  const items = await prisma.item.findMany({
    where: { photoUrl: { contains: PHOTO_PREFIX } },
    select: { id: true, photoUrl: true },
  });
  for (const item of items) {
    const next = resignPhotoUrl(item.photoUrl);
    if (next && next !== item.photoUrl) {
      await prisma.item.update({ where: { id: item.id }, data: { photoUrl: next } });
      itemUpdates += 1;
    }
  }

  const venues = await prisma.venue.findMany({
    where: { logoUrl: { contains: PHOTO_PREFIX } },
    select: { id: true, logoUrl: true },
  });
  for (const venue of venues) {
    const next = resignPhotoUrl(venue.logoUrl);
    if (next && next !== venue.logoUrl) {
      await prisma.venue.update({ where: { id: venue.id }, data: { logoUrl: next } });
      venueUpdates += 1;
    }
  }

  console.log(`Updated ${itemUpdates} item photo(s) and ${venueUpdates} venue logo(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
