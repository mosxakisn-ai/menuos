import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const DISALLOW = [
  "/api/",
  "/dashboard/",
  "/login",
  "/register",
  "/m/",
  "/s/",
  "/supervisor/",
  "/bds/",
  "/kds/",
  "/cold/",
  "/dessert/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt"],
      disallow: DISALLOW,
    },
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/sitemap-images.xml")],
    host: absoluteUrl("/"),
  };
}
