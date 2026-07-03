import type { MetadataRoute } from "next";
import { SEO_SITE } from "@/content/seo-el";
import { SEO_SITE_EN } from "@/content/seo-en";
import { getServerLocale } from "@/i18n/server";
import { APP_NAME } from "@/lib/config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getServerLocale();
  const isEn = locale === "en";

  return {
    name: isEn ? `${APP_NAME} — Digital QR menu` : `${APP_NAME} — Ψηφιακό menu με QR`,
    short_name: APP_NAME,
    description: isEn ? SEO_SITE_EN.description : SEO_SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    lang: locale,
    dir: "ltr",
    categories: ["business", "food"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
