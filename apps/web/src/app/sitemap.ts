import type { MetadataRoute } from "next";
import { SEO_SITEMAP_ROUTES } from "@/content/seo-el";
import { getAllSeoBlogSlugs } from "@/lib/seo-blog";
import { getAllSeoLandingPaths } from "@/lib/seo-landing";
import { absoluteUrl } from "@/lib/seo";

const PRIORITY: Record<string, { priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }> = {
  "/": { priority: 1, changeFrequency: "daily" },
  "/qr-menu": { priority: 0.9, changeFrequency: "weekly" },
  "/digital-menu": { priority: 0.88, changeFrequency: "weekly" },
  "/live-360": { priority: 0.9, changeFrequency: "weekly" },
  "/ypiresies": { priority: 0.9, changeFrequency: "monthly" },
  "/pos-leitourgei": { priority: 0.85, changeFrequency: "monthly" },
  "/pricing": { priority: 0.9, changeFrequency: "monthly" },
  "/sxetika": { priority: 0.6, changeFrequency: "monthly" },
  "/epikoinonia": { priority: 0.6, changeFrequency: "monthly" },
  "/terms": { priority: 0.3, changeFrequency: "yearly" },
  "/privacy": { priority: 0.3, changeFrequency: "yearly" },
  "/blog": { priority: 0.75, changeFrequency: "weekly" },
};

const BLOG_DEFAULT = { priority: 0.7, changeFrequency: "monthly" as const };
const LANDING_DEFAULT = { priority: 0.82, changeFrequency: "weekly" as const };

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const blogPaths = ["/blog", ...getAllSeoBlogSlugs().map((slug) => `/blog/${slug}`)];
  const paths = [...SEO_SITEMAP_ROUTES, ...getAllSeoLandingPaths(), ...blogPaths];

  return paths.map((path) => {
    const meta =
      PRIORITY[path] ??
      (path.startsWith("/blog/") ? BLOG_DEFAULT : LANDING_DEFAULT);
    return {
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    };
  });
}
