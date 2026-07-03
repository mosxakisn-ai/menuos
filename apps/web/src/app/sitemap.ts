import type { MetadataRoute } from "next";
import { buildSitemapSegment, SITEMAP_SEGMENT_IDS } from "@/lib/seo-sitemap";

/** Single sitemap index at /sitemap.xml (GSC + IndexNow). Tier logic lives in seo-sitemap.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_SEGMENT_IDS.flatMap((id) => buildSitemapSegment(id));
}
