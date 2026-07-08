import { DEFAULT_MARKETING_LOCALE, type MarketingLocale } from "@menuos/shared";

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

export const DEFAULT_LOCALE: Locale = DEFAULT_MARKETING_LOCALE;
export const LOCALE_COOKIE = "menuos_lang";
export const LOCALE_REQUEST_HEADER = "x-menuos-locale";

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Prefer Greek/English from Accept-Language when no cookie is set. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const code = part.trim().split(";")[0]?.toLowerCase() ?? "";
    if (code.startsWith("el")) return "el";
    if (code.startsWith("en")) return "en";
  }
  return null;
}

export function resolveLocale(value?: string | null): Locale {
  if (value && isLocale(value)) return value;
  return DEFAULT_LOCALE;
}
