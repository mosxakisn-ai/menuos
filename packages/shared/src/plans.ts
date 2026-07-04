export const SUBSCRIPTION_PLANS = ["TRIAL", "BASIC", "PRO", "ENTERPRISE"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number];

/** Free trial length for new organizations. */
export const TRIAL_DAYS = 7;

/** Extra days after trial ends — QR menu & panel stay open while owner picks a plan. */
export const TRIAL_GRACE_DAYS = 7;

export function computeTrialEndsAt(from = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function computeTrialGraceEndsAt(trialEndsAt: Date): Date {
  return new Date(trialEndsAt.getTime() + TRIAL_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

/** Trial + grace window — guests & panel until grace ends. */
export function isTrialSubscriptionActive(
  trialEndsAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!trialEndsAt) return false;
  return computeTrialGraceEndsAt(trialEndsAt).getTime() > now.getTime();
}

export type PlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  maxVenues: number;
  maxMenusPerVenue: number | null;
  maxItems: number | null;
  /** Monthly Gemini token budget for PDF AI import. null = unlimited. */
  maxGeminiTokensPerMonth: number | null;
  features: string[];
};

export const PLAN_DEFINITIONS: Record<SubscriptionPlanId, PlanDefinition> = {
  TRIAL: {
    id: "TRIAL",
    name: "Δωρεάν δοκιμή",
    priceMonthly: 0,
    maxVenues: 1,
    maxMenusPerVenue: 1,
    maxItems: 50,
    maxGeminiTokensPerMonth: 0,
    features: [
      "1 κατάστημα",
      "1 κατάλογος",
      "50 πιάτα",
      "QR καταλόγου",
      "Πολλαπλές γλώσσες",
      "Χωρίς κάρτα",
    ],
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceMonthly: 9.99,
    maxVenues: 1,
    maxMenusPerVenue: 5,
    maxItems: null,
    maxGeminiTokensPerMonth: 0,
    features: [
      "1 κατάστημα",
      "5 κατάλογοι",
      "Απεριόριστα πιάτα",
      "QR καταλόγου",
      "Πολλαπλές γλώσσες",
      "Συνεχής λειτουργία — ανανέωση κάθε μήνα",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 19.99,
    maxVenues: 3,
    maxMenusPerVenue: null,
    maxItems: null,
    maxGeminiTokensPerMonth: 500_000,
    features: ["3 καταστήματα", "Απεριόριστοι κατάλογοι", "Εισαγωγή PDF", "Πολλαπλές γλώσσες", "Προτεραιότητα", "Κλήση σερβιτόρου"],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: 0,
    maxVenues: 999,
    maxMenusPerVenue: null,
    maxItems: null,
    maxGeminiTokensPerMonth: null,
    features: ["Δικό σας domain", "White-label", "Προτεραιότητα υποστήριξης"],
  },
};

export const PAID_SUBSCRIPTION_PLANS = ["BASIC", "PRO"] as const;
export type PaidSubscriptionPlanId = (typeof PAID_SUBSCRIPTION_PLANS)[number];

export function getPlan(planId: string): PlanDefinition {
  const plan = PLAN_DEFINITIONS[planId as SubscriptionPlanId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

export function isPaidPlan(planId: string): planId is PaidSubscriptionPlanId {
  return (PAID_SUBSCRIPTION_PLANS as readonly string[]).includes(planId);
}

/** Statuses that still allow product access (PAST_DUE = grace while fixing payment). */
export function isActivePaidStatus(status: string): boolean {
  return status === "ACTIVE" || status === "TRIALING" || status === "PAST_DUE";
}

export function organizationHasPaidPlan(input: {
  plan: string;
  status: string;
  trialEndsAt?: Date | null;
}): boolean {
  if (input.plan === "TRIAL") {
    return isTrialSubscriptionActive(input.trialEndsAt);
  }
  if (input.plan === "ENTERPRISE") {
    return isActivePaidStatus(input.status);
  }
  return isPaidPlan(input.plan) && isActivePaidStatus(input.status);
}
