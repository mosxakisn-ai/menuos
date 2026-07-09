export const APP_NAME = "MenuOS";
export const APP_DOMAIN = "menuos.gr";
export const APP_URL = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "https://menuos.gr";

export type { QrMenuLanguage as SupportedLanguageCode } from "./menu-languages";
export { QR_MENU_LANGUAGES, SUPPORTED_LANGUAGES } from "./menu-languages";

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
export * from "./trial";
export * from "./item-labels";
export * from "./menu-languages";
export * from "./menu-auto-translate";
export * from "./menu-translation-langs";
export { getQrMenuUi } from "./qr-menu-ui-extended";
export * from "./menu-pdf-parser";
export * from "./menu-import-document";
export * from "./menu-pdf-parse-quality";
export * from "./demo-venue";
export * from "./showcase-junk";
export * from "./onboarding-starter-data";
export * from "./menu-cart";
export * from "./venue-spots";
export * from "./item-extras";
export * from "./pass-signal";
export * from "./waiter-table-grid";
export * from "./venue-staff-member";
export * from "./organization-activity";
export * from "./station-screen";
export * from "./station-screen-signals";
export * from "./station-screen-spots";
export * from "./station-spot-zones";
export * from "./venue-operations-config";
export * from "./kds-station-screen";
export * from "./cuisine-type";
export * from "./organization-notifications";
export * from "./pass-signal-announcement";
export * from "./pass-signal-delivery";
