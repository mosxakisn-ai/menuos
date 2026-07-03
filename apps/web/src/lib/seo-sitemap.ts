import type { MetadataRoute } from "next";
import { SEO_SITEMAP_ROUTES } from "@/content/seo-el";
import { getAllSeoBlogSlugs } from "@/lib/seo-blog";
import { getAllSeoLandingConfigs, type SeoLandingConfig } from "@/lib/seo-landing";
import { absoluteUrl } from "@/lib/seo";

type SitemapMeta = {
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
};

export const SITEMAP_SEGMENT_IDS = ["pages", "services", "cities", "industries", "blog"] as const;
export type SitemapSegmentId = (typeof SITEMAP_SEGMENT_IDS)[number];

const STATIC_PAGE_META: Record<string, SitemapMeta> = {
  "/": { priority: 1, changeFrequency: "daily" },
  "/qr-menu": { priority: 0.95, changeFrequency: "weekly" },
  "/ypiresies": { priority: 0.95, changeFrequency: "weekly" },
  "/pos-leitourgei": { priority: 0.95, changeFrequency: "weekly" },
  "/pricing": { priority: 0.9, changeFrequency: "monthly" },
  "/sxetika": { priority: 0.6, changeFrequency: "monthly" },
  "/epikoinonia": { priority: 0.6, changeFrequency: "monthly" },
  "/terms": { priority: 0.2, changeFrequency: "yearly" },
  "/privacy": { priority: 0.2, changeFrequency: "yearly" },
  "/blog": { priority: 0.7, changeFrequency: "weekly" },
};

const BLOG_POST_META: SitemapMeta = { priority: 0.6, changeFrequency: "monthly" };

function landingMeta(config: SeoLandingConfig): SitemapMeta {
  switch (config.kind) {
    case "product":
      return { priority: 0.95, changeFrequency: "weekly" };
    case "vertical":
      return { priority: 0.84, changeFrequency: "monthly" };
    case "city":
      return { priority: 0.8, changeFrequency: "monthly" };
    case "city-vertical":
      return { priority: 0.75, changeFrequency: "monthly" };
    default:
      return { priority: 0.75, changeFrequency: "monthly" };
  }
}

function entry(path: string, meta: SitemapMeta, lastModified = new Date()): MetadataRoute.Sitemap[0] {
  return {
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: meta.changeFrequency,
    priority: meta.priority,
  };
}

export function buildSitemapSegment(id: SitemapSegmentId): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const landings = getAllSeoLandingConfigs();

  switch (id) {
    case "pages":
      return SEO_SITEMAP_ROUTES.map((path) =>
        entry(path, STATIC_PAGE_META[path] ?? { priority: 0.6, changeFrequency: "monthly" }, lastModified),
      );
    case "services":
      return landings
        .filter((config) => config.kind === "product")
        .map((config) => entry(config.path, landingMeta(config), lastModified));
    case "industries":
      return landings
        .filter((config) => config.kind === "vertical")
        .map((config) => entry(config.path, landingMeta(config), lastModified));
    case "cities":
      return landings
        .filter((config) => config.kind === "city" || config.kind === "city-vertical")
        .map((config) => entry(config.path, landingMeta(config), lastModified));
    case "blog": {
      const blogPaths = ["/blog", ...getAllSeoBlogSlugs().map((slug) => `/blog/${slug}`)];
      return blogPaths.map((path) =>
        entry(path, path === "/blog" ? STATIC_PAGE_META["/blog"] : BLOG_POST_META, lastModified),
      );
    }
    default:
      return [];
  }
}

/** OG / brand images for image sitemap. */
export function getSeoImageSitemapEntries(): { pageUrl: string; imageUrl: string; title: string }[] {
  const imageUrl = absoluteUrl("/opengraph-image");
  const pages = [
    { path: "/", title: "MenuOS" },
    { path: "/qr-menu", title: "QR menu" },
    { path: "/pricing", title: "Τιμές MenuOS" },
    { path: "/live-360", title: "Live 360°" },
    { path: "/blog", title: "Blog MenuOS" },
  ];

  return pages.map(({ path, title }) => ({
    pageUrl: absoluteUrl(path),
    imageUrl,
    title,
  }));
}
