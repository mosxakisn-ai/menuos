import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/config";

/** PWA manifest for staff waiter panel — start_url must stay on /s/{slug}, not marketing home. */
export function buildStaffPwaManifest(venueSlug: string): MetadataRoute.Manifest {
  const slug = venueSlug.trim();
  const startUrl = `/s/${encodeURIComponent(slug)}`;

  return {
    id: startUrl,
    name: `${APP_NAME} — Σερβιτόρος`,
    short_name: "Σερβιτόρος",
    description: "Κλήσεις και μηνύματα πάσου από την κουζίνα.",
    start_url: startUrl,
    scope: "/s/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#2563EB",
    lang: "el",
    dir: "ltr",
    categories: ["business", "food"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
