import { SEO_SITE } from "@/content/seo-el";
import { SEO_SITE_EN } from "@/content/seo-en";
import { APP_NAME, APP_URL, SITE_DESCRIPTION } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";

type FaqItem = { q: string; a: string };
type BreadcrumbItem = { name: string; path: string };
type MarketingLocale = "el" | "en";

function schemaLanguage(locale: MarketingLocale): string {
  return locale === "en" ? "en-US" : "el-GR";
}

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
    telephone: SEO_SITE.contactPhoneTel,
    sameAs: [SEO_SITE.contactFacebook],
    areaServed: {
      "@type": "Country",
      name: "Greece",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SEO_SITE.contactEmail,
      telephone: SEO_SITE.contactPhoneTel,
      availableLanguage: ["Greek", "English", "German", "French"],
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
  };
}

export function buildSoftwareApplicationSchema(input?: {
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
}) {
  const lowPrice = input?.lowPrice ?? 0;
  const highPrice = input?.highPrice ?? 19.99;
  const offerCount = input?.offerCount ?? 3;

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
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      priceCurrency: "EUR",
      offerCount: String(offerCount),
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

export function buildWebPageSchema(input: {
  name: string;
  path: string;
  description?: string;
  locale?: MarketingLocale;
}) {
  const inLanguage = schemaLanguage(input.locale ?? "el");
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    inLanguage,
    isPartOf: { "@id": `${APP_URL}/#website` },
  };
}

export function buildPricingOffersSchema(
  offers: readonly { name: string; price: number; description: string }[],
  locale: MarketingLocale = "el",
) {
  const isEn = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: isEn ? `${APP_NAME} — Subscription` : `${APP_NAME} — Συνδρομή`,
    description: isEn
      ? "Digital QR menu platform for hospitality businesses"
      : "Πλατφόρμα ψηφιακού menu με QR για επιχειρήσεις φιλοξενίας",
    brand: { "@type": "Brand", name: APP_NAME },
    inLanguage: schemaLanguage(locale),
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
  locale?: MarketingLocale;
}) {
  const locale = input.locale ?? "el";
  const homeLabel = locale === "en" ? SEO_SITE_EN.breadcrumbHome : "Αρχική";
  const breadcrumbs = buildBreadcrumbSchema([
    { name: homeLabel, path: "/" },
    { name: input.page.breadcrumbLabel, path: input.page.path },
  ]);
  const webPage = buildWebPageSchema({
    name: input.page.title,
    path: input.page.path,
    description: input.page.description,
    locale,
  });
  const schemas: Record<string, unknown>[] = [breadcrumbs, webPage];
  if (input.faq?.length) schemas.push(buildFAQPageSchema(input.faq));
  return schemas;
}
