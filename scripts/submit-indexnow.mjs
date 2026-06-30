#!/usr/bin/env node
/**
 * Submit sitemap URLs to IndexNow (Bing, Yandex, etc.) after deploy.
 * Reads config from .env (APP_URL, INDEXNOW_KEY, INDEXNOW_HOST, RUN_INDEXNOW).
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
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // optional .env
  }
}

loadDotEnv();

const APP_URL = (
  process.env.APP_URL?.includes("menuos.gr")
    ? process.env.APP_URL
    : process.env.INDEXNOW_HOST
      ? `https://${process.env.INDEXNOW_HOST.replace(/^https?:\/\//, "")}`
      : process.env.APP_URL
)?.replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY;
const HOST = process.env.INDEXNOW_HOST ?? (APP_URL ? new URL(APP_URL).host : undefined);

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

function parseSitemapLocs(xml) {
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

async function fetchSitemapUrls() {
  const res = await fetch(`${APP_URL}/sitemap.xml`, {
    headers: { Accept: "application/xml,text/xml" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap.xml: ${res.status}`);
  }
  const xml = await res.text();
  const urls = parseSitemapLocs(xml);
  if (!urls.length) {
    throw new Error("sitemap.xml returned no URLs");
  }
  return urls;
}

async function main() {
  if (process.env.RUN_INDEXNOW !== "1") {
    console.log("RUN_INDEXNOW is not 1 — skipping IndexNow");
    return;
  }

  if (!APP_URL) {
    console.log("APP_URL not set in .env — skipping IndexNow");
    return;
  }

  if (!KEY) {
    console.log("INDEXNOW_KEY not set — skipping IndexNow");
    return;
  }

  const urlList = await fetchSitemapUrls();

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${APP_URL}/${KEY}.txt`,
    urlList,
  };

  console.log(`IndexNow: submitting ${urlList.length} URLs for ${HOST}`);

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      console.log(`  ${endpoint}: ${res.status}${text ? ` — ${text.slice(0, 120)}` : ""}`);
    } catch (err) {
      console.error(`  ${endpoint}: failed —`, err instanceof Error ? err.message : err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
