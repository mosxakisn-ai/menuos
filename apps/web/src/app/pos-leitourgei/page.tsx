import Link from "next/link";
import { MarketingCtaBand, SectionHeader, TimelineStep } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSeoIntro, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("howItWorks");
}

export default async function HowItWorksPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = getMessages(locale);
  const p = marketing.pages.howItWorks;
  const ui = pages.howItWorks;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="howItWorks" />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      {"introParagraphs" in p ? <MarketingSeoIntro paragraphs={p.introParagraphs} /> : null}
      <MarketingSection>
        <SectionHeader
          eyebrow={ui.eyebrow}
          title={ui.sectionTitle}
          description={ui.sectionDesc}
          align="left"
          className="max-w-2xl"
        />
        <div className="mx-auto mt-14 max-w-3xl">
          {ui.steps.map((step, i) => (
            <TimelineStep
              key={step.title}
              step={String(i + 1)}
              title={step.title}
              body={step.body}
              detail={step.detail}
              isLast={i === ui.steps.length - 1}
            />
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/register" className={buttonClass("primary", "lg")}>
            {ui.ctaButton}
          </Link>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title={ui.cta.title}
          description={ui.cta.description}
          primaryHref="/epikoinonia"
          primaryLabel={ui.cta.primary}
          secondaryHref="/ypiresies"
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
