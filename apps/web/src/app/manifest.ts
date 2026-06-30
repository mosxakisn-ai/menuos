import type { MetadataRoute } from "next";
import { SEO_SITE } from "@/content/seo-el";
import { APP_NAME } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Ψηφιακό menu με QR`,
    short_name: APP_NAME,
    description: SEO_SITE.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    lang: "el",
    dir: "ltr",
    categories: ["business", "food"],
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
