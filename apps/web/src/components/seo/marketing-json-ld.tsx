import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  SEO_HOME_FAQ,
  SEO_PAGES,
  SEO_PRICING_FAQ,
  SEO_PRICING_OFFERS,
  SEO_QR_MENU_FAQ,
} from "@/content/seo-el";
import {
  SEO_HOME_FAQ_EN,
  SEO_PAGES_EN,
  SEO_PRICING_FAQ_EN,
  SEO_PRICING_OFFERS_EN,
  SEO_QR_MENU_FAQ_EN,
} from "@/content/seo-en";
import { getServerLocale } from "@/i18n/server";
import { buildPricingOffersSchema, marketingPageSchema } from "@/lib/seo-structured-data";

export type MarketingJsonLdPageKey = keyof typeof SEO_PAGES;
export type MarketingJsonLdFaqKey = "home" | "qrMenu" | "pricing";

const FAQ_BY_KEY = {
  home: { el: SEO_HOME_FAQ, en: SEO_HOME_FAQ_EN },
  qrMenu: { el: SEO_QR_MENU_FAQ, en: SEO_QR_MENU_FAQ_EN },
  pricing: { el: SEO_PRICING_FAQ, en: SEO_PRICING_FAQ_EN },
} as const;

function resolveMarketingPage(key: MarketingJsonLdPageKey, locale: "el" | "en") {
  if (locale === "en") return SEO_PAGES_EN[key];
  return SEO_PAGES[key];
}

export async function HomeJsonLd() {
  const locale = await getServerLocale();
  const page = resolveMarketingPage("home", locale);
  const faq = FAQ_BY_KEY.home[locale];
  return <JsonLdScript data={marketingPageSchema({ page, faq, locale })} />;
}

export async function MarketingPageJsonLd(props: {
  pageKey: MarketingJsonLdPageKey;
  faqKey?: MarketingJsonLdFaqKey;
}) {
  const locale = await getServerLocale();
  const page = resolveMarketingPage(props.pageKey, locale);
  const faq = props.faqKey ? FAQ_BY_KEY[props.faqKey][locale] : undefined;
  return <JsonLdScript data={marketingPageSchema({ page, faq, locale })} />;
}

export async function PricingOffersJsonLd() {
  const locale = await getServerLocale();
  const offers = locale === "en" ? SEO_PRICING_OFFERS_EN : SEO_PRICING_OFFERS;
  return <JsonLdScript data={buildPricingOffersSchema(offers, locale)} />;
}
