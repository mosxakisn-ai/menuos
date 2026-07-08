import { TRIAL_DAYS } from "@menuos/shared";
import type { Locale } from "./types";
import { MARKETING } from "@/content/marketing-el";
import { MARKETING_EN } from "@/content/marketing-en";
import { PAGES_EL } from "@/content/pages-el";
import { PAGES_EN } from "@/content/pages-en";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { applyTrialDayPlaceholdersDeep } from "@/lib/trial-marketing";

export type MenuOsMessages = {
  marketing: typeof MARKETING | typeof MARKETING_EN;
  pages: typeof PAGES_EL | typeof PAGES_EN;
};

const CATALOG: Record<Locale, MenuOsMessages> = {
  el: { marketing: MARKETING, pages: PAGES_EL },
  en: { marketing: MARKETING_EN, pages: PAGES_EN },
};

/** Client-safe messages — no DB; used when switching language in the browser. */
export function getStaticMessages(locale: Locale, trialDays = TRIAL_DAYS): MenuOsMessages {
  const base = CATALOG[locale] ?? CATALOG.el;
  return {
    marketing: applyTrialDayPlaceholdersDeep(base.marketing, trialDays, locale),
    pages: applyTrialDayPlaceholdersDeep(base.pages, trialDays, locale),
  };
}

export async function getMessages(locale: Locale): Promise<MenuOsMessages> {
  const trialDays = await getTrialDaysFromCatalog().catch(() => TRIAL_DAYS);
  return getStaticMessages(locale, trialDays);
}
