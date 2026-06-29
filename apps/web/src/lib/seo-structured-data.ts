import { SEO_SITE } from "@/content/seo-el";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";

type FaqItem = { q: string; a: string };
type BreadcrumbItem = { name: string; path: string };

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${APP_URL}/#organization`,
    name: APP_NAME,
    url: APP_URL,
    logo: absoluteUrl("/icon"),
    description: SITE_DESCRIPTION,
    email: SEO_SITE.contactEmail,
    areaServed: {
      "@type": "Country",
      name: "Greece",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SEO_SITE.contactEmail,
      availableLanguage: ["Greek", "English"],
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${APP_URL}/#website`,
    name: APP_NAME,
    url: APP_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "el-GR",
    publisher: { "@id": `${APP_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${APP_URL}/qr-menu?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: APP_URL,
    inLanguage: "el-GR",
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "79",
      priceCurrency: "EUR",
      offerCount: "3",
    },
    provider: { "@id": `${APP_URL}/#organization` },
  };
}

export function buildFAQPageSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildWebPageSchema(input: { name: string; path: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    inLanguage: "el-GR",
    isPartOf: { "@id": `${APP_URL}/#website` },
  };
}

export function buildPricingOffersSchema(
  offers: readonly { name: string; price: number; description: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${APP_NAME} — Συνδρομή`,
    description: "Πλατφόρμα ψηφιακού menu με QR για επιχειρήσεις φιλοξενίας",
    brand: { "@type": "Brand", name: APP_NAME },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: String(offer.price),
      priceCurrency: "EUR",
      priceValidUntil: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().slice(0, 10),
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/pricing"),
    })),
  };
}

export function marketingPageSchema(input: {
  page: { title: string; description: string; path: string; breadcrumbLabel: string };
  faq?: readonly FaqItem[];
}) {
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Αρχική", path: "/" },
    { name: input.page.breadcrumbLabel, path: input.page.path },
  ]);
  const webPage = buildWebPageSchema({
    name: input.page.title,
    path: input.page.path,
    description: input.page.description,
  });
  const schemas: Record<string, unknown>[] = [breadcrumbs, webPage];
  if (input.faq?.length) schemas.push(buildFAQPageSchema(input.faq));
  return schemas;
}
