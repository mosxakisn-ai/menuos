"use client";

import { demoMenuUrl } from "@menuos/shared";
import { useI18n } from "@/i18n/context";

/** Locale-aware demo menu link for marketing UI. */
export function useDemoMenuUrl(table = "12"): string {
  const { locale } = useI18n();
  return demoMenuUrl({ table, siteLocale: locale });
}
