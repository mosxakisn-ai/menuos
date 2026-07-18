import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Private / operational paths — not for search or AI indexing. */
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

const ALLOW = ["/", "/llms.txt"];

/** Explicit welcome for AI crawlers (same public allow + private disallow as *). */
const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "ClaudeBot", "Google-Extended"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: DISALLOW,
      })),
    ],
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/sitemap-images.xml")],
    host: absoluteUrl("/"),
  };
}
