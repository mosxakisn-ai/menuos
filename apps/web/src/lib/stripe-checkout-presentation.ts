import type { PlanDefinition } from "@menuos/shared";
import { APP_URL } from "@/lib/config";
import { displayPlanFeature } from "@/lib/plan-feature-display";

export const MENUOS_CHECKOUT_IMAGE = `${APP_URL}/checkout-brand.png`;
export const MENUOS_CHECKOUT_LOGO = `${APP_URL}/checkout-logo.png`;

export const CHECKOUT_INVOICE_FOOTER =
  "MenuOS · Premium QR menus for hospitality · menuos.gr";

export const MENUOS_STRIPE_BRAND = {
  displayName: "MenuOS",
  backgroundColor: "#F8FAFC",
  buttonColor: "#2563EB",
  borderStyle: "rounded" as const,
  fontFamily: "inter" as const,
};

export type StripeCheckoutLocale = "el" | "en" | "auto";

export function resolveStripeCheckoutLocale(preferred?: string | null): StripeCheckoutLocale {
  if (preferred === "en" || preferred === "el" || preferred === "auto") return preferred;
  return "el";
}

function formatCheckoutPrice(priceMonthly: number): string {
  return priceMonthly.toFixed(2).replace(".", ",");
}

/** Σύντομη, premium περιγραφή χαρακτηριστικών — χωρίς technical jargon. */
export function formatCheckoutFeatureLine(features: string[]): string {
  const skip = new Set(["προτεραιότητα", "priority support"]);
  const cleaned = features
    .map((f) => displayPlanFeature(f, "GR"))
    .map((f) => f.replace(/\s*·\s*Gemini AI/gi, "").replace(/\bGemini AI\b/gi, "").trim())
    .filter((f) => f.length > 0 && !skip.has(f.toLowerCase()))
    .slice(0, 4);
  return cleaned.join(" · ");
}

function planCheckoutTagline(plan: PlanDefinition, catalogTagline?: string | null): string {
  const custom = catalogTagline?.trim();
  if (custom) return custom;
  if (plan.id === "PRO") {
    return "Για ξενοδοχεία και επιχειρήσεις με πολλαπλούς χώρους.";
  }
  if (plan.id === "BASIC") {
    return "Ιδανικό για εστιατόριο, cafe ή μοναδικό κατάστημα.";
  }
  return "Ψηφιακοί κατάλογοι με QR — χωρίς εφαρμογή για τον πελάτη.";
}

export function buildSubscriptionCheckoutCopy(
  plan: PlanDefinition,
  options?: { catalogTagline?: string | null },
) {
  const featureLine = formatCheckoutFeatureLine(plan.features);
  const price = formatCheckoutPrice(plan.priceMonthly);

  return {
    name: `MenuOS ${plan.name}`,
    description: [
      planCheckoutTagline(plan, options?.catalogTagline),
      featureLine,
      `€${price}/μήνα · Ακύρωση ανά πάσα στιγμή · menuos.gr`,
    ]
      .filter(Boolean)
      .join("\n"),
    submitMessage:
      "Η συνδρομή ενεργοποιείται αμέσως. Θα λάβετε email επιβεβαίωσης από το MenuOS.",
    invoiceDescription: `MenuOS — Συνδρομή ${plan.name}`,
  };
}

export function appendMenuOsCheckoutBranding(params: URLSearchParams) {
  params.set("branding_settings[display_name]", MENUOS_STRIPE_BRAND.displayName);
  params.set("branding_settings[icon][type]", "url");
  params.set("branding_settings[icon][url]", MENUOS_CHECKOUT_IMAGE);
  params.set("branding_settings[logo][type]", "url");
  params.set("branding_settings[logo][url]", MENUOS_CHECKOUT_LOGO);
  params.set("branding_settings[background_color]", MENUOS_STRIPE_BRAND.backgroundColor);
  params.set("branding_settings[button_color]", MENUOS_STRIPE_BRAND.buttonColor);
  params.set("branding_settings[border_style]", MENUOS_STRIPE_BRAND.borderStyle);
  params.set("branding_settings[font_family]", MENUOS_STRIPE_BRAND.fontFamily);
}

export function appendStripeCheckoutPresentation(
  params: URLSearchParams,
  options: {
    locale?: StripeCheckoutLocale;
    submitMessage: string;
    invoiceDescription: string;
    productImageUrl?: string;
    lineItemPrefix?: string;
    collectBillingAddress?: boolean;
    invoiceCreation?: boolean;
    branding?: boolean;
    includeProductImage?: boolean;
  },
) {
  params.set("locale", options.locale ?? "el");
  params.set("custom_text[submit][message]", options.submitMessage);
  if (options.invoiceCreation !== false) {
    params.set("invoice_creation[enabled]", "true");
    params.set("invoice_creation[invoice_data][description]", options.invoiceDescription);
    params.set("invoice_creation[invoice_data][footer]", CHECKOUT_INVOICE_FOOTER);
  }
  if (options.collectBillingAddress !== false) {
    params.set("billing_address_collection", "auto");
  }

  if (options.branding !== false) {
    appendMenuOsCheckoutBranding(params);
  }

  if (options.includeProductImage !== false) {
    const prefix = options.lineItemPrefix ?? "line_items[0][price_data][product_data]";
    params.set(`${prefix}[images][0]`, options.productImageUrl ?? MENUOS_CHECKOUT_IMAGE);
  }
}
