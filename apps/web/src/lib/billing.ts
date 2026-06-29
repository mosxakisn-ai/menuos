import { prisma, type SubscriptionPlan, type SubscriptionStatus } from "@menuos/db";
import {
  getPlan,
  isPaidPlan,
  organizationHasPaidPlan,
  type PaidSubscriptionPlanId,
} from "@menuos/shared";
import { sendSubscriptionActivatedEmail } from "@/lib/mail";

export async function getOrganizationSubscription(organizationId: string) {
  return prisma.subscription.findUnique({ where: { organizationId } });
}

export async function activateSubscriptionFromCheckout(input: {
  organizationId: string;
  planId: PaidSubscriptionPlanId;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
}) {
  const plan = getPlan(input.planId);
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });
  const wasAlreadyActive = existing?.plan === input.planId && existing?.status === "ACTIVE";

  await prisma.subscription.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      plan: input.planId as SubscriptionPlan,
      status: "ACTIVE" as SubscriptionStatus,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubId: input.stripeSubId ?? null,
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      plan: input.planId as SubscriptionPlan,
      status: "ACTIVE",
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      stripeSubId: input.stripeSubId ?? undefined,
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

export async function canOrganizationAddVenue(organizationId: string): Promise<
  | { ok: true }
  | { ok: false; error: string; code: string }
> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true, venues: true },
  });
  if (!org) return { ok: false, error: "Organization not found", code: "not_found" };

  const sub = org.subscription;
  const planId = sub?.plan ?? "TRIAL";
  const status = sub?.status ?? "TRIALING";

  if (!organizationHasPaidPlan({ plan: planId, status, trialEndsAt: sub?.trialEndsAt })) {
    return {
      ok: false,
      error: "Your trial has expired. Upgrade to add venues.",
      code: "trial_expired",
    };
  }

  const maxVenues = getPlan(planId).maxVenues;
  if (org.venues.length >= maxVenues) {
    return {
      ok: false,
      error: `Your ${getPlan(planId).name} plan allows up to ${maxVenues} venue(s). Upgrade to add more.`,
      code: "venue_limit",
    };
  }

  return { ok: true };
}

export function isCheckoutPlan(planId: string): planId is PaidSubscriptionPlanId {
  return isPaidPlan(planId);
}
