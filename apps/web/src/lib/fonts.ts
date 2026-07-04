import { Manrope, Playfair_Display } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin", "greek"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Serif headings for panel, QR menu, staff — not loaded on the marketing homepage. */
export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  weight: ["600", "700", "800"],
  display: "swap",
});
