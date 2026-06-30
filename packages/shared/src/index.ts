export const APP_NAME = "MenuOS";
export const APP_DOMAIN = "menuos.gr";
export const APP_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://menuos.gr";

export const SUPPORTED_LANGUAGES = ["GR", "EN", "DE", "FR"] as const;
export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const MARKETING_LOCALES = ["el", "en"] as const;
export type MarketingLocale = (typeof MARKETING_LOCALES)[number];
export const DEFAULT_MARKETING_LOCALE: MarketingLocale = "el";

export const BRAND = {
  blue: "#2563EB",
  cyan: "#06B6D4",
  navy: "#0F172A",
  surface: "#F5F7FA",
  success: "#2ECC71",
  warning: "#F39C12",
} as const;

export * from "./validation";
export * from "./plans";
export * from "./item-labels";
export * from "./menu-languages";
export * from "./menu-pdf-parser";
export * from "./demo-venue";
export * from "./menu-cart";
