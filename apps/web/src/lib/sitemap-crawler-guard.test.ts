import { describe, expect, it } from "vitest";
import {
  checkSitemapAccess,
  isSitemapGuardPath,
  isTrustedSearchCrawler,
  resetSitemapGuardBucketsForTests,
} from "./sitemap-crawler-guard";

describe("sitemap-crawler-guard", () => {
  it("matches sitemap paths only", () => {
    expect(isSitemapGuardPath("/sitemap.xml")).toBe(true);
    expect(isSitemapGuardPath("/sitemap-images.xml")).toBe(true);
    expect(isSitemapGuardPath("/robots.txt")).toBe(false);
  });

  it("trusts major search crawlers", () => {
    expect(isTrustedSearchCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      true,
    );
    expect(isTrustedSearchCrawler("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(
      true,
    );
    expect(isTrustedSearchCrawler("Mozilla/5.0 (compatible; Google-InspectionTool/1.0)")).toBe(true);
    expect(isTrustedSearchCrawler("curl/8.5.0")).toBe(false);
    expect(isTrustedSearchCrawler(null)).toBe(false);
  });

  it("rate limits non-crawler IPs after the hourly quota", () => {
    resetSitemapGuardBucketsForTests();
    const input = { ip: "203.0.113.10", pathname: "/sitemap.xml", userAgent: "curl/8.5.0" };

    for (let i = 0; i < 30; i += 1) {
      expect(checkSitemapAccess(input)).toEqual({ allowed: true });
    }

    const blocked = checkSitemapAccess(input);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("does not rate limit trusted crawlers", () => {
    resetSitemapGuardBucketsForTests();
    const input = {
      ip: "203.0.113.10",
      pathname: "/sitemap.xml",
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)",
    };

    for (let i = 0; i < 100; i += 1) {
      expect(checkSitemapAccess(input)).toEqual({ allowed: true });
    }
  });
});
