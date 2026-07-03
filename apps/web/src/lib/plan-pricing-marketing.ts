import { TRIAL_DAYS, type SubscriptionPlanId } from "@menuos/shared";
import { PAGES_EN } from "@/content/pages-en";
import { SEO_PRICING_OFFERS } from "@/content/seo-el";
import { SEO_PRICING_OFFERS_EN } from "@/content/seo-en";
import type { Locale } from "@/i18n/types";
import {
  formatPlanPriceDisplay,
  getTrialDaysFromCatalog,
  listPlanCatalogEntriesSafe,
  type PricingPlanCard,
} from "@/lib/plan-catalog-service";
import { applyTrialDayPlaceholdersDeep, formatTrialPeriodLabel } from "@/lib/trial-marketing";

const PRICING_PLAN_ORDER: SubscriptionPlanId[] = ["TRIAL", "BASIC", "PRO"];

export type SeoPricingOffer = { name: string; price: number; description: string };

/** Schema.org pricing offers — prices from DB catalog, copy from SEO content files. */
export async function getSeoPricingOffers(locale: Locale): Promise<SeoPricingOffer[]> {
  const entries = await listPlanCatalogEntriesSafe({ fresh: true });
  const staticOffers = locale === "en" ? SEO_PRICING_OFFERS_EN : SEO_PRICING_OFFERS;
  const trialDays = entries.find((e) => e.id === "TRIAL")?.trialDays ?? TRIAL_DAYS;

  const offers = PRICING_PLAN_ORDER.flatMap((planId, index) => {
    const entry = entries.find((e) => e.id === planId);
    const fallback = staticOffers[index];
    if (!entry && !fallback) return [];
    return [
      {
        name: fallback?.name ?? entry!.name,
        price: entry?.priceMonthly ?? fallback?.price ?? 0,
        description: fallback?.description ?? entry?.description ?? "",
      },
    ];
  });

  return applyTrialDayPlaceholdersDeep(offers, trialDays, locale);
}

/** Public pricing cards — DB prices/features with locale-specific marketing copy. */
export async function getMarketingPricingPlanCards(locale: Locale): Promise<PricingPlanCard[]> {
  const entries = await listPlanCatalogEntriesSafe({ fresh: true });
  const visible = entries.filter((e) => e.visibleOnPricing && e.id !== "ENTERPRISE");

  if (locale === "el") {
    return visible.map((e) => ({
      planId: e.id,
      name: e.name,
      price: formatPlanPriceDisplay(e.priceMonthly, e.priceDisplay),
      period:
        e.id === "TRIAL" && e.trialDays && e.trialDays > 0
          ? formatTrialPeriodLabel(e.trialDays, "el")
          : e.periodLabel,
      description: e.description ?? "",
      features: [...e.features],
      cta: e.ctaLabel ?? "Εγγραφή",
      ...(e.badge ? { badge: e.badge } : {}),
      ...(e.highlighted ? { highlighted: true } : {}),
    }));
  }

  const enPlans = PAGES_EN.pricing.plans;
  return visible.map((e) => {
    const index = PRICING_PLAN_ORDER.indexOf(e.id);
    const en = index >= 0 ? enPlans[index] : undefined;
    const trialDays = e.trialDays ?? TRIAL_DAYS;
    const period =
      e.id === "TRIAL" && e.trialDays && e.trialDays > 0
        ? formatTrialPeriodLabel(e.trialDays, "en")
        : (en?.period ?? e.periodLabel);

    const badge =
      en && "badge" in en && en.badge ? en.badge : e.badge ?? undefined;
    const highlighted = (en && "highlighted" in en && en.highlighted) || e.highlighted;

    return {
      planId: e.id,
      name: en?.name ?? e.name,
      price: formatPlanPriceDisplay(e.priceMonthly, e.priceDisplay),
      period: period.includes("{trialDays}")
        ? applyTrialDayPlaceholdersDeep(period, trialDays, "en")
        : period,
      description: en?.description ?? e.description ?? "",
      features: en?.features ? [...en.features] : [...e.features],
      cta: en?.cta ?? e.ctaLabel ?? "Sign up",
      ...(badge ? { badge } : {}),
      ...(highlighted ? { highlighted: true } : {}),
    };
  });
}

/** Aggregate offer bounds for SoftwareApplication JSON-LD. */
export async function getCatalogOfferBounds(): Promise<{
  lowPrice: number;
  highPrice: number;
  offerCount: number;
}> {
  const entries = await listPlanCatalogEntriesSafe({ fresh: true });
  const priced = entries.filter((e) => e.visibleOnPricing && e.id !== "ENTERPRISE");
  const prices = priced.map((e) => e.priceMonthly);
  const paid = prices.filter((p) => p > 0);
  return {
    lowPrice: prices.length ? Math.min(...prices) : 0,
    highPrice: paid.length ? Math.max(...paid) : 0,
    offerCount: priced.length || 3,
  };
}

export type CatalogPriceLabels = {
  basicPrice: string;
  proPrice: string;
};

export async function getCatalogPriceLabels(): Promise<CatalogPriceLabels> {
  const entries = await listPlanCatalogEntriesSafe({ fresh: true });
  const basic = entries.find((e) => e.id === "BASIC");
  const pro = entries.find((e) => e.id === "PRO");
  return {
    basicPrice: basic ? formatPlanPriceDisplay(basic.priceMonthly, basic.priceDisplay) : "€9.99",
    proPrice: pro ? formatPlanPriceDisplay(pro.priceMonthly, pro.priceDisplay) : "€19.99",
  };
}

function applyCatalogPricePlaceholders(text: string, labels: CatalogPriceLabels): string {
  return text.replaceAll("{basicPrice}", labels.basicPrice).replaceAll("{proPrice}", labels.proPrice);
}

function applyCatalogPricePlaceholdersDeep<T>(value: T, labels: CatalogPriceLabels): T {
  if (typeof value === "string") {
    return applyCatalogPricePlaceholders(value, labels) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyCatalogPricePlaceholdersDeep(item, labels)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = applyCatalogPricePlaceholdersDeep(nested, labels);
    }
    return out as T;
  }
  return value;
}

/** Trial + catalog price placeholders for SEO/marketing copy. */
export async function applyCatalogMarketingPlaceholdersDeep<T>(
  value: T,
  locale: Locale = "el",
): Promise<T> {
  const [trialDays, priceLabels] = await Promise.all([
    getTrialDaysFromCatalog(),
    getCatalogPriceLabels(),
  ]);
  const withPrices = applyCatalogPricePlaceholdersDeep(value, priceLabels);
  return applyTrialDayPlaceholdersDeep(withPrices, trialDays, locale);
}
