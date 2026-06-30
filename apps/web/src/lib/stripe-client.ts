import { createHmac, timingSafeEqual } from "node:crypto";
import { getPlan, type PaidSubscriptionPlanId } from "@menuos/shared";
import { APP_URL } from "@/lib/config";
import {
  appendStripeCheckoutPresentation,
  buildSubscriptionCheckoutCopy,
  resolveStripeCheckoutLocale,
} from "@/lib/stripe-checkout-presentation";
import {
  appendMenuOsProductMetadata,
  appendStripeMetadata,
  getStripeSecretKey,
  getStripeWebhookSecret,
  isStripeEnabled,
  isMenuOsStripeMetadata,
  menuOsStripeMetadata,
  MENUOS_STRIPE_APP,
} from "@/lib/stripe-config";

export { isStripeEnabled, isMenuOsStripeMetadata, MENUOS_STRIPE_APP };

const STRIPE_API = "https://api.stripe.com/v1";

function stripeHeaders(): HeadersInit {
  const key = getStripeSecretKey();
  if (!key) throw new Error("MENUOS_STRIPE_SECRET_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function stripePost<T>(path: string, params: URLSearchParams): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: stripeHeaders(),
    body: params.toString(),
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Stripe error ${res.status}`);
  }
  return data;
}

export async function stripeGetSession(sessionId: string) {
  const key = getStripeSecretKey();
  if (!key) throw new Error("MENUOS_STRIPE_SECRET_KEY not configured");

  const res = await fetch(`${STRIPE_API}/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const session = (await res.json()) as {
    payment_status?: string;
    mode?: string;
    metadata?: Record<string, string>;
    customer?: string | null;
    subscription?: string | null;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(session.error?.message ?? `Stripe error ${res.status}`);
  }
  return session;
}

export async function cancelStripeSubscription(stripeSubId: string): Promise<void> {
  const key = getStripeSecretKey();
  if (!key) throw new Error("MENUOS_STRIPE_SECRET_KEY not configured");

  const res = await fetch(`${STRIPE_API}/subscriptions/${stripeSubId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: { message?: string } };
    throw new Error(data.error?.message ?? `Stripe cancel failed ${res.status}`);
  }
}

export async function createPlanCheckoutSession(input: {
  organizationId: string;
  planId: PaidSubscriptionPlanId;
  customerEmail?: string;
  stripeCustomerId?: string | null;
  returnPath?: string;
  locale?: string;
}): Promise<{ url: string; sessionId: string }> {
  const plan = getPlan(input.planId);
  if (plan.priceMonthly === 0) {
    throw new Error("This plan does not require Stripe checkout");
  }

  const returnPath = input.returnPath ?? "/dashboard/billing";
  const safeReturn = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const sep = safeReturn.includes("?") ? "&" : "?";
  const successUrl = `${APP_URL}${safeReturn}${sep}billing=confirm&session_id={CHECKOUT_SESSION_ID}&plan=${input.planId}`;
  const cancelUrl = `${APP_URL}${safeReturn}${sep}billing=cancelled&plan=${input.planId}`;

  const metadata = menuOsStripeMetadata("subscription", {
    organizationId: input.organizationId,
    planId: input.planId,
    planName: plan.name,
  });

  const copy = buildSubscriptionCheckoutCopy(plan);

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set(
    "client_reference_id",
    `menuos:sub:${input.organizationId}:${input.planId}`,
  );
  appendStripeMetadata(params, metadata);
  appendMenuOsProductMetadata(params, "subscription_data", metadata);
  params.set("subscription_data[description]", copy.invoiceDescription);
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][product_data][name]", copy.name);
  params.set("line_items[0][price_data][product_data][description]", copy.description);
  appendMenuOsProductMetadata(params, "line_items[0][price_data][product_data]", metadata);
  appendStripeCheckoutPresentation(params, {
    locale: resolveStripeCheckoutLocale(input.locale),
    submitMessage: copy.submitMessage,
    invoiceDescription: copy.invoiceDescription,
    invoiceCreation: false,
  });
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(plan.priceMonthly * 100)));
  params.set("line_items[0][price_data][recurring][interval]", "month");
  params.set("line_items[0][quantity]", "1");
  if (input.stripeCustomerId) {
    params.set("customer", input.stripeCustomerId);
  } else if (input.customerEmail) {
    params.set("customer_email", input.customerEmail);
  }

  const session = await stripePost<{ id: string; url: string }>("/checkout/sessions", params);
  return { url: session.url, sessionId: session.id };
}

export function verifyStripeWebhookSignature(payload: string, signature: string): boolean {
  const secret = getStripeWebhookSecret();
  if (!secret) return false;

  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSec > 300) return false;

  const signed = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signed).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export async function stripeGetSubscription(subscriptionId: string) {
  const key = getStripeSecretKey();
  if (!key) throw new Error("MENUOS_STRIPE_SECRET_KEY not configured");

  const res = await fetch(`${STRIPE_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const subscription = (await res.json()) as {
    status?: string;
    current_period_end?: number;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(subscription.error?.message ?? `Stripe error ${res.status}`);
  }
  return subscription;
}

export async function activateSubscriptionFromCheckoutSession(input: {
  organizationId: string;
  planId: string;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  currentPeriodEnd?: Date | null;
  sendActivationEmail?: boolean;
}) {
  const { activateSubscriptionFromCheckout, isCheckoutPlan } = await import("@/lib/billing");
  if (!isCheckoutPlan(input.planId)) return;
  await activateSubscriptionFromCheckout({
    organizationId: input.organizationId,
    planId: input.planId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubId: input.stripeSubId,
    currentPeriodEnd: input.currentPeriodEnd,
    sendActivationEmail: input.sendActivationEmail,
  });
}
