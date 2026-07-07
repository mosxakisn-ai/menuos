import { Manrope } from "next/font/google";

/** Single static Manrope — enables early preload in root layout (unicode-range loads only needed subset). */
export const manrope = Manrope({
  subsets: ["latin", "greek"],
  variable: "--font-manrope",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});
