import type { SubscriptionPlanId } from "@menuos/shared";
import type { PlanCatalogUpdateInput } from "@/lib/plan-catalog-service";
import { formatTrialPeriodLabel } from "@/lib/trial-marketing";

export type PlanCatalogEditableField = keyof PlanCatalogUpdateInput;

const MARKETING_FIELDS: PlanCatalogEditableField[] = [
  "name",
  "description",
  "features",
  "priceDisplay",
  "periodLabel",
  "ctaLabel",
  "badge",
  "highlighted",
  "visibleOnPricing",
  "sortOrder",
];

const LIMIT_FIELDS: PlanCatalogEditableField[] = [
  "maxVenues",
  "maxMenusPerVenue",
  "maxItems",
  "maxGeminiTokensPerMonth",
];

function editableForPlan(planId: SubscriptionPlanId): Set<PlanCatalogEditableField> {
  switch (planId) {
    case "TRIAL":
      return new Set<PlanCatalogEditableField>([
        "name",
        "description",
        "features",
        "trialDays",
        "maxVenues",
        "maxMenusPerVenue",
        "maxItems",
        "ctaLabel",
        "visibleOnPricing",
        "sortOrder",
      ]);
    case "BASIC":
      return new Set<PlanCatalogEditableField>([
        ...MARKETING_FIELDS,
        "maxVenues",
        "maxMenusPerVenue",
        "maxItems",
      ]);
    case "PRO":
      return new Set<PlanCatalogEditableField>([...MARKETING_FIELDS, ...LIMIT_FIELDS]);
    case "ENTERPRISE":
      return new Set<PlanCatalogEditableField>([
        "name",
        "description",
        "features",
        "ctaLabel",
        "badge",
        "visibleOnPricing",
        "sortOrder",
      ]);
    default:
      return new Set();
  }
}

export function isPlanCatalogFieldEditable(
  planId: SubscriptionPlanId,
  field: PlanCatalogEditableField,
): boolean {
  return editableForPlan(planId).has(field);
}

export function planCatalogFieldLockReason(
  planId: SubscriptionPlanId,
  field: PlanCatalogEditableField,
): string | null {
  if (isPlanCatalogFieldEditable(planId, field)) return null;

  if (field === "priceMonthly") {
    if (planId === "TRIAL") return "Η δοκιμή είναι πάντα δωρεάν (€0).";
    if (planId === "ENTERPRISE") return "Enterprise — τιμολόγηση κατόπιν συνεννόησης, όχι self-checkout.";
    return "Η τιμή χρεώνεται μέσω Stripe — άλλαξέ την με scripts/setup-menuos-stripe.mjs και deploy.";
  }

  if (field === "priceDisplay" && planId === "TRIAL") {
    return "Για δοκιμή εμφανίζεται πάντα €0.";
  }

  if (field === "periodLabel" && planId === "TRIAL") {
    return "Η περίοδος υπολογίζεται αυτόματα από τις ημέρες δοκιμής.";
  }

  if (field === "maxGeminiTokensPerMonth" && planId === "BASIC") {
    return "Το Basic δεν περιλαμβάνει Gemini AI — μόνο στο Pro.";
  }

  if (field === "maxGeminiTokensPerMonth" && planId === "TRIAL") {
    return "Η δοκιμή δεν έχει Gemini AI.";
  }

  if (field === "trialDays" && planId !== "TRIAL") {
    return "Οι ημέρες δοκιμής ισχύουν μόνο για το πακέτο TRIAL.";
  }

  if (LIMIT_FIELDS.includes(field) && planId === "ENTERPRISE") {
    return "Τα όρια Enterprise ρυθμίζονται χειροκίνητα ανά πελάτη — όχι από εδώ.";
  }

  if (field === "priceDisplay" && planId === "ENTERPRISE") {
    return "Enterprise — χωρίς δημόσια τιμή στο site.";
  }

  if (field === "periodLabel" && planId === "ENTERPRISE") {
    return "Enterprise — χωρίς μηνιαία self-checkout τιμή.";
  }

  return "Δεν επεξεργάζεται για αυτό το πακέτο.";
}

export function planCatalogEditSummary(planId: SubscriptionPlanId): string {
  switch (planId) {
    case "TRIAL":
      return "Επεξεργάζεσαι κείμενο marketing, ημέρες δοκιμής και όρια δοκιμής. Η τιμή μένει €0.";
    case "BASIC":
    case "PRO":
      return "Επεξεργάζεσαι κείμενο, marketing και όρια χρήσης. Η τιμή €/μήνα αλλάζει μόνο μέσω Stripe setup.";
    case "ENTERPRISE":
      return "Μόνο κείμενο marketing και CTA. Τιμή και όρια — κατόπιν συνεννόησης με τον πελάτη.";
    default:
      return "";
  }
}

/** Strip disallowed fields and apply derived values (server-side guard). */
export function sanitizePlanCatalogUpdate(
  planId: SubscriptionPlanId,
  input: PlanCatalogUpdateInput,
): PlanCatalogUpdateInput {
  const allowed = editableForPlan(planId);
  const out: PlanCatalogUpdateInput = {};

  for (const key of Object.keys(input) as PlanCatalogEditableField[]) {
    const value = input[key];
    if (value !== undefined && allowed.has(key)) {
      (out as Record<string, unknown>)[key] = value;
    }
  }

  if (planId === "TRIAL") {
    out.priceMonthly = 0;
    out.priceDisplay = "€0";
    out.maxGeminiTokensPerMonth = 0;
    if (out.trialDays != null && out.trialDays > 0) {
      out.periodLabel = formatTrialPeriodLabel(out.trialDays);
    }
  }

  if (planId === "BASIC") {
    out.maxGeminiTokensPerMonth = 0;
  }

  return out;
}

export function planHasEditableLimits(planId: SubscriptionPlanId): boolean {
  return LIMIT_FIELDS.some((field) => isPlanCatalogFieldEditable(planId, field));
}

export function planShowsTrialDays(planId: SubscriptionPlanId): boolean {
  return planId === "TRIAL";
}
