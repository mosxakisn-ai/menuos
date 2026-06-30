import Link from "next/link";
import { Check } from "lucide-react";
import { FaqBlock, MarketingCtaBand } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buttonClass } from "@/components/ui/button";
import { getServerLocale } from "@/i18n/server";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { getSeoLandingBreadcrumbs, getSeoLandingCopy } from "@/lib/seo-landing-content";
import type { SeoLandingConfig } from "@/lib/seo-landing";
import { buildBreadcrumbSchema, buildFAQPageSchema, buildWebPageSchema } from "@/lib/seo-structured-data";

export async function SeoLandingPage({ config }: { config: SeoLandingConfig }) {
  const locale = await getServerLocale();
  const trialDays = await getTrialDaysFromCatalog();
  const copy = getSeoLandingCopy(config, locale, trialDays);
  const breadcrumbs = getSeoLandingBreadcrumbs(config, copy, locale);
  const homeLabel = locale === "en" ? "Home" : "Αρχική";
  const trialLabel = locale === "en" ? "Start free trial" : "Ξεκίνα δωρεάν δοκιμή";
  const pricingLabel = locale === "en" ? "See pricing" : "Δες τις τιμές";

  const jsonLd = [
    buildBreadcrumbSchema(breadcrumbs),
    buildWebPageSchema({
      name: copy.metaTitle,
      path: config.path,
      description: copy.metaDescription,
      locale,
    }),
    buildFAQPageSchema(copy.faq),
  ];

  return (
    <MarketingLayout>
      <JsonLdScript data={jsonLd} />
      <MarketingPageHero title={copy.h1} subtitle={copy.paragraphs[0]} badge={copy.eyebrow} />
      <MarketingSection>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-brand-blue">
                {homeLabel}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-brand-navy">{copy.breadcrumbLabel}</li>
          </ol>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-base leading-relaxed text-slate-600">
            {copy.paragraphs.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="space-y-3 rounded-card border border-slate-200/80 bg-white p-6 shadow-soft">
            {copy.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-navy">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
                {item}
              </li>
            ))}
            <li className="pt-2">
              <Link href="/register" className={buttonClass("primary")}>
                {trialLabel}
              </Link>
            </li>
          </ul>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <h2 className="text-center text-2xl font-extrabold text-brand-navy">
          {locale === "en" ? "Common questions" : "Συχνές ερωτήσεις"}
        </h2>
        <div className="mx-auto mt-8 max-w-3xl">
          <FaqBlock items={copy.faq} />
        </div>
      </MarketingSection>
      <MarketingSection>
        <MarketingCtaBand
          title={copy.ctaTitle}
          description={copy.ctaDescription}
          primaryHref="/register"
          primaryLabel={trialLabel}
          secondaryHref="/pricing"
          secondaryLabel={pricingLabel}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
