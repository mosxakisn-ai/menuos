import { prisma, type SubscriptionPlan, type SubscriptionStatus } from "@menuos/db";
import {
  getPlan,
  isPaidPlan,
  organizationHasPaidPlan,
  type PaidSubscriptionPlanId,
  type PlanDefinition,
} from "@menuos/shared";
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
      plan: getPlan("TRIAL"),
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
    plan: getPlan(sub.plan),
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
}) {
  const plan = getPlan(input.planId);
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });
  const wasAlreadyActive = existing?.plan === input.planId && existing?.status === "ACTIVE";

  const periodEnd =
    input.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
  if (!wasAlreadyActive && admin && org) {
    void sendSubscriptionActivatedEmail({
      to: admin.email,
      name: admin.name,
      businessName: org.name,
      planId: plan.name,
      priceMonthly: plan.priceMonthly,
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
  let organizationId = input.organizationId ?? null;

  if (!organizationId && input.stripeSubId) {
    const row = await prisma.subscription.findFirst({
      where: { stripeSubId: input.stripeSubId },
    });
    organizationId = row?.organizationId ?? null;
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
  if (!org) return { ok: false, error: "Organization not found", code: "not_found" };

  const ctx = await getOrganizationPlanContext(organizationId);
  if (!ctx?.active) {
    return {
      ok: false,
      error: "Your trial has expired. Upgrade to add venues.",
      code: "trial_expired",
    };
  }

  const maxVenues = ctx.plan.maxVenues;
  if (org.venues.length >= maxVenues) {
    return {
      ok: false,
      error: `Your ${ctx.plan.name} plan allows up to ${maxVenues} venue(s). Upgrade to add more.`,
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
    return { ok: false, error: "Subscription inactive.", code: "subscription_inactive" };
  }

  const maxMenus = ctx.plan.maxMenusPerVenue;
  if (maxMenus === null) return { ok: true };

  const count = await prisma.menu.count({ where: { venueId } });
  if (count >= maxMenus) {
    return {
      ok: false,
      error: `Your ${ctx.plan.name} plan allows up to ${maxMenus} menu(s) per venue.`,
      code: "menu_limit",
    };
  }

  return { ok: true };
}

export async function canOrganizationAddItem(
  organizationId: string,
): Promise<{ ok: true } | { ok: false; error: string; code: string }> {
  const ctx = await getOrganizationPlanContext(organizationId);
  if (!ctx?.active) {
    return { ok: false, error: "Subscription inactive.", code: "subscription_inactive" };
  }

  const maxItems = ctx.plan.maxItems;
  if (maxItems === null) return { ok: true };

  const count = await prisma.item.count({
    where: { category: { menu: { venue: { organizationId } } } },
  });
  if (count >= maxItems) {
    return {
      ok: false,
      error: `Your ${ctx.plan.name} plan allows up to ${maxItems} items.`,
      code: "item_limit",
    };
  }

  return { ok: true };
}

export function isCheckoutPlan(planId: string): planId is PaidSubscriptionPlanId {
  return isPaidPlan(planId);
}

export function mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "CANCELED";
  }
}
