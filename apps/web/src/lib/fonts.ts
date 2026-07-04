import { Playfair_Display } from "next/font/google";
import type { Locale } from "@/i18n/types";

/** Load one Manrope subset per locale — avoids shipping both @font-face blocks in CSS. */
export async function manropeClassForLocale(locale: Locale): Promise<string> {
  if (locale === "el") {
    const { manropeGreek } = await import("@/lib/fonts-manrope-greek");
    return manropeGreek.variable;
  }
  const { manropeLatin } = await import("@/lib/fonts-manrope-latin");
  return manropeLatin.variable;
}

/** Serif headings for panel, QR menu, staff — not loaded on the marketing homepage. */
export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});
