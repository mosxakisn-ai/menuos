/** Public demo venue seeded by scripts/seed-master-user.mjs */
export const DEMO_VENUE_SLUG = "demo-taverna";
export const DEMO_TABLE = "12";

export type SiteLocale = "el" | "en";

export function demoMenuLangFromSiteLocale(locale: SiteLocale): string {
  return locale === "en" ? "en" : "el";
}

export function demoMenuUrl(params?: {
  table?: string;
  lang?: string;
  siteLocale?: SiteLocale;
}): string {
  const q = new URLSearchParams();
  if (params?.table) q.set("table", params.table);
  const lang =
    params?.lang ??
    (params?.siteLocale ? demoMenuLangFromSiteLocale(params.siteLocale) : undefined);
  if (lang) q.set("lang", lang);
  const qs = q.toString();
  return `/m/${DEMO_VENUE_SLUG}${qs ? `?${qs}` : ""}`;
}
