import { Playfair_Display } from "next/font/google";

export { manrope } from "@/lib/fonts-manrope";

/** Serif headings for panel, QR menu, staff — not loaded on the marketing homepage. */
export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});
