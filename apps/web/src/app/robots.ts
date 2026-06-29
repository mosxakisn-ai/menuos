import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const DISALLOW = ["/api/", "/dashboard/", "/login", "/register", "/m/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
