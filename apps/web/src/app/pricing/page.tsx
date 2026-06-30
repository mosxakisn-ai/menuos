import type { Metadata } from "next";
import Link from "next/link";
import {
  FaqBlock,
  MarketingCtaBand,
  PricingCard,
  SectionHeader,
  StatStrip,
} from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES, SEO_PRICING_OFFERS } from "@/content/seo-el";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { buildPricingOffersSchema } from "@/lib/seo-structured-data";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.pricing);

export default async function PricingPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = getMessages(locale);
  const p = marketing.pages.pricing;
  const ui = pages.pricing;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.pricing} />
      <JsonLdScript data={buildPricingOffersSchema(SEO_PRICING_OFFERS)} />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...marketing.stats]} />
      </MarketingSection>
      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {ui.plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={[...plan.features]}
              cta={plan.cta}
              href="/register"
              highlighted={"highlighted" in plan ? !!plan.highlighted : false}
              badge={"badge" in plan ? plan.badge : undefined}
            />
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-2xl rounded-card border border-slate-200/80 bg-gradient-to-br from-brand-surface to-white p-8 text-center shadow-card">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-blue">Enterprise</p>
          <h2 className="mt-2 text-2xl font-extrabold text-brand-navy">{ui.enterpriseTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{ui.enterpriseDesc}</p>
          <Link href="/epikoinonia" className={`mt-6 inline-flex ${buttonClass("secondary")}`}>
            {ui.enterpriseCta}
          </Link>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <SectionHeader title={ui.faqTitle} description={ui.faqDesc} />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqBlock items={[...p.faq]} />
        </div>
      </MarketingSection>
      <MarketingSection>
        <MarketingCtaBand
          title={ui.cta.title}
          description={ui.cta.description}
          primaryHref="/register"
          primaryLabel={ui.cta.primary}
          secondaryHref="/epikoinonia"
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
