import type { MetadataRoute } from "next";
import { SEO_SITEMAP_ROUTES } from "@/content/seo-el";
import { absoluteUrl } from "@/lib/seo";

const PRIORITY: Record<string, { priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }> = {
  "/": { priority: 1, changeFrequency: "daily" },
  "/qr-menu": { priority: 0.9, changeFrequency: "weekly" },
  "/ypiresies": { priority: 0.9, changeFrequency: "monthly" },
  "/pos-leitourgei": { priority: 0.85, changeFrequency: "monthly" },
  "/pricing": { priority: 0.9, changeFrequency: "monthly" },
  "/sxetika": { priority: 0.6, changeFrequency: "monthly" },
  "/epikoinonia": { priority: 0.6, changeFrequency: "monthly" },
  "/terms": { priority: 0.3, changeFrequency: "yearly" },
  "/privacy": { priority: 0.3, changeFrequency: "yearly" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return SEO_SITEMAP_ROUTES.map((path) => {
    const meta = PRIORITY[path] ?? { priority: 0.5, changeFrequency: "monthly" as const };
    return {
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    };
  });
}
