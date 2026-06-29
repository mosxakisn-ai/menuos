/**
 * MenuOS Stripe — ξεχωριστό προϊόν στο CloudEra Stripe account.
 * ΜΗΝ χρησιμοποιείς MATCHWORK_* ή generic STRIPE_SECRET_KEY.
 *
 * Stripe Dashboard filter: metadata.app = menuos
 */
export const MENUOS_STRIPE_APP = "menuos";
export const MENUOS_STRIPE_PLATFORM = "menuos.gr";
export const MENUOS_STRIPE_PRODUCT_LINE = "menuos";

export type MenuOsPaymentKind = "subscription";

export function getStripeSecretKey(): string | undefined {
  return process.env.MENUOS_STRIPE_SECRET_KEY?.trim() || undefined;
}

export function getStripeWebhookSecret(): string | undefined {
  return process.env.MENUOS_STRIPE_WEBHOOK_SECRET?.trim() || undefined;
}

export function isStripeEnabled(): boolean {
  return !!getStripeSecretKey();
}

/** Mock billing — local dev/tests only. Never in production. */
export function isBillingMockAllowed(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.BILLING_MOCK === "true") return true;
  if (!getStripeSecretKey()) return true;
  return false;
}

export function menuOsStripeMetadata(
  kind: MenuOsPaymentKind,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    app: MENUOS_STRIPE_APP,
    platform: MENUOS_STRIPE_PLATFORM,
    product_line: MENUOS_STRIPE_PRODUCT_LINE,
    source: `menuos_${kind}`,
    kind,
    type: kind,
    ...extra,
  };
}

export function isMenuOsStripeMetadata(metadata: Record<string, string> | undefined | null): boolean {
  return metadata?.app === MENUOS_STRIPE_APP;
}

export function appendStripeMetadata(params: URLSearchParams, metadata: Record<string, string>) {
  for (const [key, value] of Object.entries(metadata)) {
    params.set(`metadata[${key}]`, value);
  }
}

export function appendMenuOsProductMetadata(
  params: URLSearchParams,
  prefix: string,
  metadata: Record<string, string>,
) {
  for (const [key, value] of Object.entries(metadata)) {
    params.set(`${prefix}[metadata][${key}]`, value);
  }
}
