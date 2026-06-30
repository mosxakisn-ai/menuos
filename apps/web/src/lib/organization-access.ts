import { organizationHasPaidPlan } from "@menuos/shared";

type SubscriptionRow = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
} | null;

/** Whether guests may view the public QR menu for this organization. */
export function organizationIsPubliclyActive(subscription: SubscriptionRow): boolean {
  if (!subscription) return false;
  return organizationHasPaidPlan({
    plan: subscription.plan,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
  });
}
