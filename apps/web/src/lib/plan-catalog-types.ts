import type { PlanDefinition, SubscriptionPlanId } from "@menuos/shared";

export type PlanCatalogEntry = PlanDefinition & {
  sortOrder: number;
  description: string | null;
  periodLabel: string;
  priceDisplay: string | null;
  ctaLabel: string | null;
  badge: string | null;
  highlighted: boolean;
  visibleOnPricing: boolean;
  trialDays: number | null;
  updatedAt: string;
};

export type PricingPlanCard = {
  planId: SubscriptionPlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  highlighted?: boolean;
};

export function formatPlanPriceDisplay(priceMonthly: number, priceDisplay: string | null): string {
  if (priceDisplay?.trim()) return priceDisplay.trim();
  if (priceMonthly === 0) return "€0";
  return `€${Number.isInteger(priceMonthly) ? priceMonthly : priceMonthly.toFixed(2)}`;
}
