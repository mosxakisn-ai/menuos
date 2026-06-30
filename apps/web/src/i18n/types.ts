import type { MarketingLocale } from "@menuos/shared";

export type Locale = MarketingLocale;

export const LOCALES: Locale[] = ["el", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  el: "Ελληνικά",
  en: "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  el: "🇬🇷",
  en: "🇬🇧",
};

export const DEFAULT_LOCALE: Locale = "el";
export const LOCALE_COOKIE = "menuos_lang";
export const LOCALE_REQUEST_HEADER = "x-menuos-locale";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function resolveLocale(value?: string | null): Locale {
  if (value && isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
