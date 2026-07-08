import { prisma, type PlanCatalog, type SubscriptionPlan } from "@menuos/db";
import {
  SUBSCRIPTION_PLANS,
  TRIAL_DAYS,
  getPlan,
  type PlanDefinition,
  type SubscriptionPlanId,
} from "@menuos/shared";
import {
  formatPlanPriceDisplay,
  type PlanCatalogEntry,
  type PricingPlanCard,
} from "@/lib/plan-catalog-types";
import { formatTrialPeriodLabel } from "@/lib/trial-marketing";
import { sanitizePlanCatalogUpdate } from "@/lib/plan-catalog-edit-policy";

export type { PlanCatalogEntry, PricingPlanCard } from "@/lib/plan-catalog-types";
export { formatPlanPriceDisplay } from "@/lib/plan-catalog-types";

type PlanCatalogSeed = {
  sortOrder: number;
  name: string;
  priceMonthly: number;
  priceDisplay: string | null;
  periodLabel: string;
  description: string;
  features: string[];
  maxVenues: number;
  maxMenusPerVenue: number | null;
  maxItems: number | null;
  maxGeminiTokensPerMonth: number | null;
  ctaLabel: string;
  badge: string | null;
  highlighted: boolean;
  visibleOnPricing: boolean;
  trialDays: number | null;
};

const DEFAULT_CATALOG: Record<SubscriptionPlanId, PlanCatalogSeed> = {
  TRIAL: {
    sortOrder: 0,
    name: "Δοκιμή",
    priceMonthly: 0,
    priceDisplay: "€0",
    periodLabel: " / 7 ημέρες",
    description: "Για να δοκιμάσεις την πλατφόρμα πριν επιλέξεις πλάνο.",
    features: [
      "1 κατάστημα",
      "1 κατάλογος",
      "50 πιάτα",
      "QR καταλόγου",
      "Πολλαπλές γλώσσες",
      "Χωρίς κάρτα",
    ],
    maxVenues: 1,
    maxMenusPerVenue: 1,
    maxItems: 50,
    maxGeminiTokensPerMonth: 0,
    ctaLabel: "Εγγραφή",
    badge: null,
    highlighted: false,
    visibleOnPricing: true,
    trialDays: TRIAL_DAYS,
  },
  BASIC: {
    sortOrder: 1,
    name: "Basic",
    priceMonthly: 9.99,
    priceDisplay: "€9.99",
    periodLabel: "/μήνα",
    description: "Ιδανικό για εστιατόριο, cafe ή μοναδικό κατάστημα.",
    features: [
      "1 κατάστημα",
      "5 κατάλογοι",
      "Απεριόριστα πιάτα",
      "QR καταλόγου",
      "Πολλαπλές γλώσσες",
      "Συνεχής λειτουργία — ανανέωση κάθε μήνα",
    ],
    maxVenues: 1,
    maxMenusPerVenue: 5,
    maxItems: null,
    maxGeminiTokensPerMonth: 0,
    ctaLabel: "Ξεκίνα Basic",
    badge: "Δημοφιλές",
    highlighted: true,
    visibleOnPricing: true,
    trialDays: null,
  },
  PRO: {
    sortOrder: 2,
    name: "Pro",
    priceMonthly: 19.99,
    priceDisplay: "€19.99",
    periodLabel: "/μήνα",
    description: "Για ξενοδοχεία και επιχειρήσεις με πολλαπλούς χώρους.",
    features: [
      "3 καταστήματα",
      "Απεριόριστοι κατάλογοι",
      "Live 360°",
      "Κλήση σερβιτόρου",
      "Φωνή στο κινητό",
      "Πολλαπλές γλώσσες",
      "Εισαγωγή PDF",
      "Προτεραιότητα",
    ],
    maxVenues: 3,
    maxMenusPerVenue: null,
    maxItems: null,
    maxGeminiTokensPerMonth: 500_000,
    ctaLabel: "Ξεκίνα Pro",
    badge: null,
    highlighted: false,
    visibleOnPricing: true,
    trialDays: null,
  },
  ENTERPRISE: {
    sortOrder: 3,
    name: "Enterprise",
    priceMonthly: 0,
    priceDisplay: null,
    periodLabel: "/μήνα",
    description: "White-label, custom domain, πολλαπλά καταστήματα, προτεραιότητα υποστήριξης.",
    features: ["Δικό σας domain", "White-label", "Προτεραιότητα υποστήριξης"],
    maxVenues: 999,
    maxMenusPerVenue: null,
    maxItems: null,
    maxGeminiTokensPerMonth: null,
    ctaLabel: "Ζήτησε προσφορά",
    badge: null,
    highlighted: false,
    visibleOnPricing: false,
    trialDays: null,
  },
};

let cache: { at: number; entries: PlanCatalogEntry[] } | null = null;
const CACHE_MS = 30_000;

function parseFeatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((f): f is string => typeof f === "string" && f.trim().length > 0);
}

function rowToEntry(row: PlanCatalog): PlanCatalogEntry {
  const planId = row.plan as SubscriptionPlanId;
  return {
    id: planId,
    name: row.name,
    priceMonthly: Number(row.priceMonthly),
    maxVenues: row.maxVenues,
    maxMenusPerVenue: row.maxMenusPerVenue,
    maxItems: row.maxItems,
    maxGeminiTokensPerMonth: row.maxGeminiTokensPerMonth,
    features: parseFeatures(row.features),
    sortOrder: row.sortOrder,
    description: row.description,
    periodLabel: row.periodLabel,
    priceDisplay: row.priceDisplay,
    ctaLabel: row.ctaLabel,
    badge: row.badge,
    highlighted: row.highlighted,
    visibleOnPricing: row.visibleOnPricing,
    trialDays: row.trialDays,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function invalidatePlanCatalogCache() {
  cache = null;
}

function mergeFeaturesWithSeed(_current: string[], seed: string[]): string[] {
  return [...seed];
}

async function syncPlanCatalogLimitsFromSeed(): Promise<boolean> {
  let anyChanged = false;
  for (const planId of SUBSCRIPTION_PLANS) {
    const seed = DEFAULT_CATALOG[planId];
    const row = await prisma.planCatalog.findUnique({
      where: { plan: planId as SubscriptionPlan },
      select: {
        maxVenues: true,
        maxMenusPerVenue: true,
        maxItems: true,
        maxGeminiTokensPerMonth: true,
      },
    });
    if (!row) continue;

    const sameLimits =
      row.maxVenues === seed.maxVenues &&
      row.maxMenusPerVenue === seed.maxMenusPerVenue &&
      row.maxItems === seed.maxItems &&
      row.maxGeminiTokensPerMonth === seed.maxGeminiTokensPerMonth;
    if (sameLimits) continue;

    await prisma.planCatalog.update({
      where: { plan: planId as SubscriptionPlan },
      data: {
        maxVenues: seed.maxVenues,
        maxMenusPerVenue: seed.maxMenusPerVenue,
        maxItems: seed.maxItems,
        maxGeminiTokensPerMonth: seed.maxGeminiTokensPerMonth,
      },
    });
    anyChanged = true;
  }
  return anyChanged;
}

async function syncPlanCatalogFeaturesFromSeed(): Promise<boolean> {
  let anyChanged = false;
  for (const planId of SUBSCRIPTION_PLANS) {
    const seed = DEFAULT_CATALOG[planId];
    const row = await prisma.planCatalog.findUnique({
      where: { plan: planId as SubscriptionPlan },
      select: { features: true },
    });
    if (!row) continue;

    const current = parseFeatures(row.features);
    const merged = mergeFeaturesWithSeed(current, seed.features);
    const changed =
      merged.length !== current.length || merged.some((feature, index) => feature !== current[index]);
    if (!changed) continue;

    await prisma.planCatalog.update({
      where: { plan: planId as SubscriptionPlan },
      data: { features: merged },
    });
    anyChanged = true;
  }
  return anyChanged;
}

export async function ensurePlanCatalogSeeded(): Promise<void> {
  for (const planId of SUBSCRIPTION_PLANS) {
    const seed = DEFAULT_CATALOG[planId];
    await prisma.planCatalog.upsert({
      where: { plan: planId as SubscriptionPlan },
      create: {
        plan: planId as SubscriptionPlan,
        sortOrder: seed.sortOrder,
        name: seed.name,
        priceMonthly: seed.priceMonthly,
        priceDisplay: seed.priceDisplay,
        periodLabel: seed.periodLabel,
        description: seed.description,
        features: seed.features,
        maxVenues: seed.maxVenues,
        maxMenusPerVenue: seed.maxMenusPerVenue,
        maxItems: seed.maxItems,
        maxGeminiTokensPerMonth: seed.maxGeminiTokensPerMonth,
        ctaLabel: seed.ctaLabel,
        badge: seed.badge,
        highlighted: seed.highlighted,
        visibleOnPricing: seed.visibleOnPricing,
        trialDays: seed.trialDays,
      },
      update: {},
    });
  }

  await prisma.planCatalog.updateMany({
    where: { plan: "PRO", maxGeminiTokensPerMonth: null },
    data: { maxGeminiTokensPerMonth: 500_000 },
  });

  const featuresSynced = await syncPlanCatalogFeaturesFromSeed();
  const limitsSynced = await syncPlanCatalogLimitsFromSeed();
  if (featuresSynced || limitsSynced) invalidatePlanCatalogCache();
}

export async function listPlanCatalogEntries(options?: { fresh?: boolean }): Promise<PlanCatalogEntry[]> {
  if (!options?.fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.entries;

  await ensurePlanCatalogSeeded();

  const rows = await prisma.planCatalog.findMany({ orderBy: { sortOrder: "asc" } });
  const entries = rows.map(rowToEntry);
  if (!options?.fresh) {
    cache = { at: Date.now(), entries };
  }
  return entries;
}

export async function getPlanFromCatalog(planId: string): Promise<PlanDefinition> {
  const entries = await listPlanCatalogEntries();
  const found = entries.find((e) => e.id === planId);
  if (found) {
    const { id, name, priceMonthly, maxVenues, maxMenusPerVenue, maxItems, maxGeminiTokensPerMonth, features } = found;
    return { id, name, priceMonthly, maxVenues, maxMenusPerVenue, maxItems, maxGeminiTokensPerMonth, features };
  }
  return getPlan(planId);
}

export async function getPlanCatalogEntry(planId: string): Promise<PlanCatalogEntry | null> {
  const entries = await listPlanCatalogEntries();
  return entries.find((e) => e.id === planId) ?? null;
}

export async function getPricingPlanCards(): Promise<PricingPlanCard[]> {
  const entries = await listPlanCatalogEntries();
  return entries
    .filter((e) => e.visibleOnPricing)
    .map((e) => ({
      planId: e.id,
      name: e.name,
      price: formatPlanPriceDisplay(e.priceMonthly, e.priceDisplay),
      period:
        e.id === "TRIAL" && e.trialDays && e.trialDays > 0
          ? formatTrialPeriodLabel(e.trialDays)
          : e.periodLabel,
      description: e.description ?? "",
      features: [...e.features],
      cta: e.ctaLabel ?? "Εγγραφή",
      ...(e.badge ? { badge: e.badge } : {}),
      ...(e.highlighted ? { highlighted: true } : {}),
    }));
}

export async function getEnterprisePlanEntry(): Promise<PlanCatalogEntry | null> {
  return getPlanCatalogEntry("ENTERPRISE");
}

export type PlanCatalogUpdateInput = {
  name?: string;
  priceMonthly?: number;
  priceDisplay?: string | null;
  periodLabel?: string;
  description?: string | null;
  features?: string[];
  maxVenues?: number;
  maxMenusPerVenue?: number | null;
  maxItems?: number | null;
  maxGeminiTokensPerMonth?: number | null;
  ctaLabel?: string | null;
  badge?: string | null;
  highlighted?: boolean;
  visibleOnPricing?: boolean;
  trialDays?: number | null;
  sortOrder?: number;
};

export async function updatePlanCatalog(
  planId: SubscriptionPlanId,
  input: PlanCatalogUpdateInput,
): Promise<PlanCatalogEntry> {
  const existing = await prisma.planCatalog.findUnique({ where: { plan: planId as SubscriptionPlan } });
  if (!existing) {
    await ensurePlanCatalogSeeded();
  }

  const sanitized = sanitizePlanCatalogUpdate(planId, input);
  if (!Object.keys(sanitized).length) {
    throw new Error("No allowed fields to update for this plan.");
  }

  const row = await prisma.planCatalog.update({
    where: { plan: planId as SubscriptionPlan },
    data: {
      ...(sanitized.name !== undefined ? { name: sanitized.name } : {}),
      ...(sanitized.priceMonthly !== undefined ? { priceMonthly: sanitized.priceMonthly } : {}),
      ...(sanitized.priceDisplay !== undefined ? { priceDisplay: sanitized.priceDisplay } : {}),
      ...(sanitized.periodLabel !== undefined ? { periodLabel: sanitized.periodLabel } : {}),
      ...(sanitized.description !== undefined ? { description: sanitized.description } : {}),
      ...(sanitized.features !== undefined ? { features: sanitized.features } : {}),
      ...(sanitized.maxVenues !== undefined ? { maxVenues: sanitized.maxVenues } : {}),
      ...(sanitized.maxMenusPerVenue !== undefined ? { maxMenusPerVenue: sanitized.maxMenusPerVenue } : {}),
      ...(sanitized.maxItems !== undefined ? { maxItems: sanitized.maxItems } : {}),
      ...(sanitized.maxGeminiTokensPerMonth !== undefined
        ? { maxGeminiTokensPerMonth: sanitized.maxGeminiTokensPerMonth }
        : {}),
      ...(sanitized.ctaLabel !== undefined ? { ctaLabel: sanitized.ctaLabel } : {}),
      ...(sanitized.badge !== undefined ? { badge: sanitized.badge } : {}),
      ...(sanitized.highlighted !== undefined ? { highlighted: sanitized.highlighted } : {}),
      ...(sanitized.visibleOnPricing !== undefined ? { visibleOnPricing: sanitized.visibleOnPricing } : {}),
      ...(sanitized.trialDays !== undefined ? { trialDays: sanitized.trialDays } : {}),
      ...(sanitized.sortOrder !== undefined ? { sortOrder: sanitized.sortOrder } : {}),
    },
  });

  invalidatePlanCatalogCache();
  return rowToEntry(row);
}

export async function getPlanPriceMap(): Promise<Record<string, number>> {
  const entries = await listPlanCatalogEntries();
  return Object.fromEntries(entries.map((e) => [e.id, e.priceMonthly]));
}

function defaultCatalogEntries(): PlanCatalogEntry[] {
  return SUBSCRIPTION_PLANS.map((planId) => {
    const seed = DEFAULT_CATALOG[planId];
    return {
      id: planId,
      name: seed.name,
      priceMonthly: seed.priceMonthly,
      maxVenues: seed.maxVenues,
      maxMenusPerVenue: seed.maxMenusPerVenue,
      maxItems: seed.maxItems,
      maxGeminiTokensPerMonth: seed.maxGeminiTokensPerMonth,
      features: [...seed.features],
      sortOrder: seed.sortOrder,
      description: seed.description,
      periodLabel: seed.periodLabel,
      priceDisplay: seed.priceDisplay,
      ctaLabel: seed.ctaLabel,
      badge: seed.badge,
      highlighted: seed.highlighted,
      visibleOnPricing: seed.visibleOnPricing,
      trialDays: seed.trialDays,
      updatedAt: new Date(0).toISOString(),
    };
  });
}

/** Same as listPlanCatalogEntries but falls back to defaults if DB/table unavailable. */
export async function listPlanCatalogEntriesSafe(options?: {
  fresh?: boolean;
}): Promise<PlanCatalogEntry[]> {
  try {
    return await listPlanCatalogEntries(options);
  } catch (err) {
    console.error("[menuos-plan-catalog] DB unavailable, using defaults", err);
    return defaultCatalogEntries();
  }
}

export async function getEnterprisePlanEntrySafe(): Promise<PlanCatalogEntry | null> {
  try {
    return await getEnterprisePlanEntry();
  } catch {
    return defaultCatalogEntries().find((e) => e.id === "ENTERPRISE") ?? null;
  }
}

export async function getTrialDaysFromCatalog(): Promise<number> {
  try {
    const trial = await getPlanCatalogEntry("TRIAL");
    if (trial?.trialDays && trial.trialDays > 0) return trial.trialDays;
  } catch {
    // fall through
  }
  return TRIAL_DAYS;
}
