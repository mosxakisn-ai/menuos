/** Stripe Dashboard deep links for ops (supervisor panel). */

export function stripeCustomerDashboardUrl(customerId: string): string {
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
}

export function stripeSubscriptionDashboardUrl(subscriptionId: string): string {
  return `https://dashboard.stripe.com/subscriptions/${encodeURIComponent(subscriptionId)}`;
}
