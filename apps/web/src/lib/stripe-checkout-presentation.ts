import type { PlanDefinition } from "@menuos/shared";
import { APP_URL } from "@/lib/config";

export const MENUOS_CHECKOUT_IMAGE = `${APP_URL}/icon`;

export const CHECKOUT_INVOICE_FOOTER =
  "MenuOS · Premium QR menus for hospitality · menuos.gr";

export type StripeCheckoutLocale = "el" | "en" | "auto";

export function resolveStripeCheckoutLocale(preferred?: string | null): StripeCheckoutLocale {
  if (preferred === "en" || preferred === "el" || preferred === "auto") return preferred;
  return "el";
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

  const prefix = options.lineItemPrefix ?? "line_items[0][price_data][product_data]";
  params.set(`${prefix}[images][0]`, options.productImageUrl ?? MENUOS_CHECKOUT_IMAGE);
}

export function buildSubscriptionCheckoutCopy(plan: PlanDefinition) {
  const features =
    plan.features.length > 0
      ? plan.features.map((f) => `• ${f}`).join("\n")
      : "• Digital QR menus · Multi-language · Call waiter";

  return {
    name: `MenuOS — ${plan.name} (monthly)`,
    description: [
      "Μηνιαία συνδρομή MenuOS για ψηφιακά QR menus.",
      "",
      "Περιλαμβάνει:",
      features,
      "",
      `Τιμή: €${plan.priceMonthly}/μήνα · Ακύρωση ανά πάσα στιγμή.`,
    ].join("\n"),
    submitMessage:
      "Η συνδρομή ενεργοποιείται αμέσως μετά την πληρωμή. Θα λάβετε email από το MenuOS.",
    invoiceDescription: `MenuOS — Συνδρομή ${plan.name}`,
  };
}
