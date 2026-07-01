import { prisma, type SubscriptionPlan, type SubscriptionStatus } from "@menuos/db";
import {
  isPaidPlan,
  organizationHasPaidPlan,
  PAID_SUBSCRIPTION_PLANS,
  type PaidSubscriptionPlanId,
  type PlanDefinition,
} from "@menuos/shared";
import { getPlanFromCatalog, getPlanPriceMap } from "@/lib/plan-catalog-service";
import { sendSubscriptionActivatedEmail } from "@/lib/mail";

export type OrganizationPlanContext = {
  active: boolean;
  planId: string;
  status: string;
  trialEndsAt: Date | null;
  plan: PlanDefinition;
};

export async function getOrganizationSubscription(organizationId: string) {
  return prisma.subscription.findUnique({ where: { organizationId } });
}

export async function getOrganizationPlanContext(
  organizationId: string,
): Promise<OrganizationPlanContext | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true },
  });
  if (!org) return null;

  const sub = org.subscription;
  if (!sub) {
    return {
      active: false,
      planId: "TRIAL",
      status: "TRIALING",
      trialEndsAt: null,
      plan: await getPlanFromCatalog("TRIAL"),
    };
  }

  const active = organizationHasPaidPlan({
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
  });

  return {
    active,
    planId: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
    plan: await getPlanFromCatalog(sub.plan),
  };
}

export async function organizationHasActiveSubscription(organizationId: string): Promise<boolean> {
  const ctx = await getOrganizationPlanContext(organizationId);
  return ctx?.active ?? false;
}

export async function activateSubscriptionFromCheckout(input: {
  organizationId: string;
  planId: PaidSubscriptionPlanId;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  currentPeriodEnd?: Date | null;
  sendActivationEmail?: boolean;
}) {
  const plan = await getPlanFromCatalog(input.planId);
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });
  const wasAlreadyActive = existing?.plan === input.planId && existing?.status === "ACTIVE";
  const sendEmail = input.sendActivationEmail !== false;

  let periodEnd: Date;
  if (input.currentPeriodEnd) {
    periodEnd = input.currentPeriodEnd;
  } else if (input.stripeSubId) {
    throw new Error("Missing subscription period end");
  } else {
    periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const previousSubId = existing?.stripeSubId;
  if (
    previousSubId &&
    input.stripeSubId &&
    previousSubId !== input.stripeSubId
  ) {
    const { cancelStripeSubscription, isStripeEnabled } = await import("@/lib/stripe-client");
    if (isStripeEnabled()) {
      await cancelStripeSubscription(previousSubId).catch((err) =>
        console.error("[menuos-billing] failed to cancel previous Stripe subscription", err),
      );
    }
  }

  await prisma.subscription.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      plan: input.planId as SubscriptionPlan,
      status: "ACTIVE" as SubscriptionStatus,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubId: input.stripeSubId ?? null,
      trialEndsAt: null,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: input.planId as SubscriptionPlan,
      status: "ACTIVE",
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      stripeSubId: input.stripeSubId ?? undefined,
      trialEndsAt: null,
      currentPeriodEnd: periodEnd,
    },
  });

  const org = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    include: { users: { where: { role: "ADMIN" }, take: 1 } },
  });
  const admin = org?.users[0];
  if (sendEmail && !wasAlreadyActive && admin && org) {
    void sendSubscriptionActivatedEmail({
      to: admin.email,
      name: admin.name,
      businessName: org.name,
      planName: plan.name,
      priceMonthly: plan.priceMonthly,
      renewalDate: periodEnd.toLocaleDateString("el-GR"),
    }).catch((err) => console.error("[menuos-mail] subscription email failed", err));
  }

  return { plan: plan.name };
}

export async function subscribeOrganizationMock(
  organizationId: string,
  planId: PaidSubscriptionPlanId,
) {
  return activateSubscriptionFromCheckout({ organizationId, planId });
}

export async function syncSubscriptionFromStripe(input: {
  organizationId?: string | null;
  stripeSubId?: string | null;
  stripeCustomerId?: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
  planId?: PaidSubscriptionPlanId;
}) {
  let organizationId: string | null = null;

  if (input.stripeSubId) {
    const bySub = await prisma.subscription.findFirst({
      where: { stripeSubId: input.stripeSubId },
    });
    organizationId = bySub?.organizationId ?? null;
  }

  if (
    organizationId &&
    input.organizationId &&
    input.organizationId !== organizationId
  ) {
    console.error(
      "[menuos-billing] Stripe metadata organizationId mismatch — using subscription linkage",
      { metadataOrg: input.organizationId, linkedOrg: organizationId, stripeSubId: input.stripeSubId },
    );
  }

  if (!organizationId && input.organizationId) {
    organizationId = input.organizationId;
  }

  if (!organizationId) return null;

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      status: input.status,
      ...(input.stripeSubId ? { stripeSubId: input.stripeSubId } : {}),
      ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
      ...(input.currentPeriodEnd ? { currentPeriodEnd: input.currentPeriodEnd } : {}),
      ...(input.planId ? { plan: input.planId as SubscriptionPlan } : {}),
    },
  });

  return organizationId;
}

export async function canOrganizationAddVenue(organizationId: string): Promise<
  | { ok: true }
  | { ok: false; error: string; code: string }
> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true, venues: true },
  });
  if (!org) return { ok: false, error: "Ο οργανισμός δεν βρέθηκε.", code: "not_found" };

  const ctx = await getOrganizationPlanContext(organizationId);
  if (!ctx?.active) {
    return {
      ok: false,
      error:
        ctx?.planId === "TRIAL"
          ? "Η δωρεάν δοκιμή έληξε. Αναβάθμισε για να προσθέσεις καταστήματα."
          : "Η συνδρομή δεν είναι ενεργή. Ανανέωσε για να προσθέσεις καταστήματα.",
      code: ctx?.planId === "TRIAL" ? "trial_expired" : "subscription_inactive",
    };
  }

  const maxVenues = ctx.plan.maxVenues;
  if (org.venues.length >= maxVenues) {
    return {
      ok: false,
      error: `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxVenues} μαγαζιά.`,
      code: "venue_limit",
    };
  }

  return { ok: true };
}

export async function canOrganizationAddMenu(
  organizationId: string,
  venueId: string,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  const ctx = await getOrganizationPlanContext(organizationId);
  if (!ctx?.active) {
    return { ok: false, error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" };
  }

  const maxMenus = ctx.plan.maxMenusPerVenue;
  if (maxMenus === null) return { ok: true };

  const count = await prisma.menu.count({ where: { venueId } });
  if (count >= maxMenus) {
    return {
      ok: false,
      error: `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxMenus} menu ανά μαγαζί.`,
      code: "menu_limit",
    };
  }

  return { ok: true };
}

export async function canOrganizationAddItems(
  organizationId: string,
  countToAdd: number,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  if (countToAdd < 1) return { ok: true };

  const ctx = await getOrganizationPlanContext(organizationId);
  if (!ctx?.active) {
    return { ok: false, error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" };
  }

  const maxItems = ctx.plan.maxItems;
  if (maxItems === null) return { ok: true };

  const count = await prisma.item.count({
    where: { category: { menu: { venue: { organizationId } } } },
  });
  if (count + countToAdd > maxItems) {
    const remaining = Math.max(0, maxItems - count);
    return {
      ok: false,
      error:
        remaining > 0
          ? `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxItems} είδη. Μπορείς να προσθέσεις ακόμα ${remaining}.`
          : `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxItems} είδη.`,
      code: "item_limit",
    };
  }

  return { ok: true };
}

export async function canOrganizationAddItem(
  organizationId: string,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  return canOrganizationAddItems(organizationId, 1);
}

export function isCheckoutPlan(planId: string): planId is PaidSubscriptionPlanId {
  return isPaidPlan(planId);
}

export async function planIdFromStripeSubscription(
  subscription: Record<string, unknown>,
): Promise<PaidSubscriptionPlanId | undefined> {
  const metadata = (subscription.metadata ?? {}) as Record<string, string>;
  if (metadata.planId && isCheckoutPlan(metadata.planId)) return metadata.planId;

  const items = subscription.items as
    | { data?: Array<{ price?: { unit_amount?: number | null } }> }
    | undefined;
  const amount = items?.data?.[0]?.price?.unit_amount;
  if (amount == null) return undefined;

  const prices = await getPlanPriceMap();
  for (const planId of PAID_SUBSCRIPTION_PLANS) {
    const cents = Math.round((prices[planId] ?? 0) * 100);
    if (cents === amount) return planId;
  }

  if (amount === 999) return "BASIC";
  if (amount === 1999) return "PRO";
  return undefined;
}

export function mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "paused":
      return "PAST_DUE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "incomplete":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "PAST_DUE";
  }
}

export function organizationCanUsePdfImport(planId: string): boolean {
  return planId === "PRO" || planId === "ENTERPRISE";
}
