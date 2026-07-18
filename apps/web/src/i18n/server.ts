import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_REQUEST_HEADER,
  localeFromAcceptLanguage,
  resolveLocale,
  type Locale,
} from "./types";

export async function getServerLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(LOCALE_REQUEST_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;

  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) return cookie;

  return localeFromAcceptLanguage(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}

/**
 * Locale for SEO canonical / hreflang self-reference — only from `?lang=` in the URL.
 * Cookie and Accept-Language must not move the canonical away from the crawled URL.
 */
export async function getSeoUrlLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(LOCALE_REQUEST_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;

  const search = headerStore.get("x-menuos-search");
  if (search) {
    const lang = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("lang");
    if (lang) return resolveLocale(lang);
  }
  return DEFAULT_LOCALE;
}
