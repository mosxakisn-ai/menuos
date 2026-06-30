#!/usr/bin/env node
/**
 * Submit sitemap URLs to IndexNow (Bing, Yandex, etc.) after deploy.
 *
 * Required env: INDEXNOW_KEY
 * Optional: APP_URL (default https://menuos.gr), INDEXNOW_HOST (default from APP_URL)
 * Set RUN_INDEXNOW=1 to enable (server-deploy.sh checks this).
 */

const APP_URL = (process.env.APP_URL ?? "https://menuos.gr").replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY;
const HOST = process.env.INDEXNOW_HOST ?? new URL(APP_URL).host;

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
