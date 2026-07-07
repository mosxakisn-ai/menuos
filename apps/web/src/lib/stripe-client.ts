import { createHmac, timingSafeEqual } from "node:crypto";
import { type PaidSubscriptionPlanId } from "@menuos/shared";
import { getPlanFromCatalog, getPlanCatalogEntry } from "@/lib/plan-catalog-service";
import { APP_URL } from "@/lib/config";
import { safeReturnPath } from "@/lib/safe-return-path";
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

const STRIPE_CHECKOUT_API_VERSION = "2025-09-30.clover";

function stripeHeaders(apiVersion?: string): HeadersInit {
  const key = getStripeSecretKey();
  if (!key) throw new Error("MENUOS_STRIPE_SECRET_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
    ...(apiVersion ? { "Stripe-Version": apiVersion } : {}),
  };
}

async function stripePost<T>(
  path: string,
  params: URLSearchParams,
  options?: { apiVersion?: string },
): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: stripeHeaders(options?.apiVersion),
    body: params.toString(),
  });
  const data = (await res.json()) as T & { error?: { message?: string; param?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Stripe error ${res.status}`);
  }
  return data;
}

function isUnsupportedBrandingError(message: string): boolean {
  return /branding_settings|logo URL path must end|image URL path must end/i.test(message);
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

function buildCheckoutSessionParams(input: {
  organizationId: string;
  planId: PaidSubscriptionPlanId;
  customerEmail?: string;
  stripeCustomerId?: string | null;
  returnPath?: string;
  locale?: string;
  plan: Awaited<ReturnType<typeof getPlanFromCatalog>>;
  copy: ReturnType<typeof buildSubscriptionCheckoutCopy>;
  metadata: Record<string, string>;
  branding: boolean;
}): URLSearchParams {
  const safeReturn = safeReturnPath(input.returnPath);
  const sep = safeReturn.includes("?") ? "&" : "?";
  const successUrl = `${APP_URL}${safeReturn}${sep}billing=confirm&session_id={CHECKOUT_SESSION_ID}&plan=${input.planId}`;
  const cancelUrl = `${APP_URL}${safeReturn}${sep}billing=cancelled&plan=${input.planId}`;

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", successUrl);
  params.set("cancel_url", cancelUrl);
  params.set(
    "client_reference_id",
    `menuos:sub:${input.organizationId}:${input.planId}`,
  );
  appendStripeMetadata(params, input.metadata);
  appendMenuOsProductMetadata(params, "subscription_data", input.metadata);
  params.set("subscription_data[description]", input.copy.invoiceDescription);
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][product_data][name]", input.copy.name);
  params.set("line_items[0][price_data][product_data][description]", input.copy.description);
  appendMenuOsProductMetadata(params, "line_items[0][price_data][product_data]", input.metadata);
  appendStripeCheckoutPresentation(params, {
    locale: resolveStripeCheckoutLocale(input.locale),
    submitMessage: input.copy.submitMessage,
    invoiceDescription: input.copy.invoiceDescription,
    invoiceCreation: false,
    branding: input.branding,
  });
  params.set(
    "line_items[0][price_data][unit_amount]",
    String(Math.round(input.plan.priceMonthly * 100)),
  );
  params.set("line_items[0][price_data][recurring][interval]", "month");
  params.set("line_items[0][quantity]", "1");
  if (input.stripeCustomerId) {
    params.set("customer", input.stripeCustomerId);
  } else if (input.customerEmail) {
    params.set("customer_email", input.customerEmail);
  }
  return params;
}

export async function createPlanCheckoutSession(input: {
  organizationId: string;
  planId: PaidSubscriptionPlanId;
  customerEmail?: string;
  stripeCustomerId?: string | null;
  returnPath?: string;
  locale?: string;
  visitorSid?: string | null;
}): Promise<{ url: string; sessionId: string }> {
  const plan = await getPlanFromCatalog(input.planId);
  if (plan.priceMonthly === 0) {
    throw new Error("This plan does not require Stripe checkout");
  }

  const catalogEntry = await getPlanCatalogEntry(input.planId);

  const metadata = menuOsStripeMetadata("subscription", {
    organizationId: input.organizationId,
    planId: input.planId,
    planName: plan.name,
    ...(input.visitorSid?.trim() ? { visitorSid: input.visitorSid.trim().slice(0, 64) } : {}),
  });

  const copy = buildSubscriptionCheckoutCopy(plan, {
    catalogTagline: catalogEntry?.description,
  });

  const sessionInput = {
    organizationId: input.organizationId,
    planId: input.planId,
    customerEmail: input.customerEmail,
    stripeCustomerId: input.stripeCustomerId,
    returnPath: input.returnPath,
    locale: input.locale,
    plan,
    copy,
    metadata,
  };

  let session: { id: string; url: string };
  try {
    session = await stripePost<{ id: string; url: string }>(
      "/checkout/sessions",
      buildCheckoutSessionParams({ ...sessionInput, branding: true }),
      { apiVersion: STRIPE_CHECKOUT_API_VERSION },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isUnsupportedBrandingError(message)) throw err;
    session = await stripePost<{ id: string; url: string }>(
      "/checkout/sessions",
      buildCheckoutSessionParams({ ...sessionInput, branding: false }),
    );
  }

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
