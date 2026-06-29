export const SUBSCRIPTION_PLANS = ["TRIAL", "BASIC", "PRO", "ENTERPRISE"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLANS)[number];

export type PlanDefinition = {
  id: SubscriptionPlanId;
  name: string;
  priceMonthly: number;
  maxVenues: number;
  maxMenusPerVenue: number | null;
  maxItems: number | null;
  features: string[];
};

export const PLAN_DEFINITIONS: Record<SubscriptionPlanId, PlanDefinition> = {
  TRIAL: {
    id: "TRIAL",
    name: "Trial",
    priceMonthly: 0,
    maxVenues: 1,
    maxMenusPerVenue: 1,
    maxItems: 50,
    features: ["1 venue", "1 menu", "50 items", "QR codes"],
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceMonthly: 29,
    maxVenues: 1,
    maxMenusPerVenue: 3,
    maxItems: null,
    features: ["1 venue", "3 menus", "Unlimited items", "QR codes", "Call waiter"],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 79,
    maxVenues: 3,
    maxMenusPerVenue: null,
    maxItems: null,
    features: ["3 venues", "Unlimited menus", "OCR import", "Web push", "Priority support"],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: 0,
    maxVenues: 999,
    maxMenusPerVenue: null,
    maxItems: null,
    features: ["Custom domain", "White-label", "Priority support"],
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

export function isActivePaidStatus(status: string): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

export function organizationHasPaidPlan(input: {
  plan: string;
  status: string;
  trialEndsAt?: Date | null;
}): boolean {
  if (input.plan === "TRIAL") {
    if (!input.trialEndsAt) return true;
    return input.trialEndsAt.getTime() > Date.now();
  }
  if (input.plan === "ENTERPRISE") return true;
  return isPaidPlan(input.plan) && isActivePaidStatus(input.status);
}
