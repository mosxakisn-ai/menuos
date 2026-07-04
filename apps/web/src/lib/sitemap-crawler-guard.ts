/** Paths listed in robots.txt — allow search crawlers, throttle aggressive scrapers. */
export const SITEMAP_GUARD_PATHS = ["/sitemap.xml", "/sitemap-images.xml"] as const;

const TRUSTED_SEARCH_CRAWLER_PATTERNS = [
  /googlebot/i,
  /google-inspectiontool/i,
  /googleother/i,
  /storebot-google/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /applebot/i,
  /petalbot/i,
  /sogou/i,
] as const;

/** Non-search bots: 30 fetches / hour / IP / path (enough for humans, slows bulk scrapers). */
const SITEMAP_RATE_LIMIT = 30;
const SITEMAP_RATE_WINDOW_MS = 60 * 60 * 1000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastCleanup = 0;

export function isSitemapGuardPath(pathname: string): boolean {
  return (SITEMAP_GUARD_PATHS as readonly string[]).includes(pathname);
}

export function isTrustedSearchCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return TRUSTED_SEARCH_CRAWLER_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function sitemapGuardClientIp(forwardedFor: string | null, realIp: string | null): string {
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return realIp ?? "unknown";
}

export function checkSitemapAccess(input: {
  ip: string;
  pathname: string;
  userAgent: string | null;
}): { allowed: true } | { allowed: false; retryAfterSec: number } {
  if (isTrustedSearchCrawler(input.userAgent)) {
    return { allowed: true };
  }

  const key = `${input.ip}:${input.pathname}`;
  const now = Date.now();

  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [bucketKey, entry] of buckets) {
      if (now > entry.resetAt) buckets.delete(bucketKey);
    }
  }

  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + SITEMAP_RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= SITEMAP_RATE_LIMIT) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  entry.count += 1;
  return { allowed: true };
}

/** Reset in-memory buckets (tests only). */
export function resetSitemapGuardBucketsForTests(): void {
  buckets.clear();
  lastCleanup = 0;
}
