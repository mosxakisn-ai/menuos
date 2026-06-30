import Link from "next/link";
import { Camera, Globe, RefreshCw, Smartphone, Utensils } from "lucide-react";
import {
  FaqBlock,
  FeatureCard,
  MarketingCtaBand,
  SectionHeader,
} from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSeoIntro, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("qrMenu");
}

const benefitIcons = [RefreshCw, Globe, Camera, Smartphone];

export default async function QrMenuLandingPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = getMessages(locale);
  const p = marketing.pages.qrMenu;
  const ui = pages.qrMenu;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="qrMenu" faqKey="qrMenu" />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      {"introParagraphs" in p ? <MarketingSeoIntro paragraphs={p.introParagraphs} /> : null}
      <MarketingSection>
        <SectionHeader title={ui.sectionTitle} description={ui.sectionDesc} />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {ui.benefits.map((b, i) => {
            const Icon = benefitIcons[i] ?? RefreshCw;
            return <FeatureCard key={b.title} icon={Icon} {...b} learnMoreLabel={pages.common.learnMore} />;
          })}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <SectionHeader
            align="left"
            eyebrow={ui.useCasesEyebrow}
            title={ui.useCasesTitle}
            description={ui.useCasesDesc}
            className="max-w-none"
          />
          <ul className="space-y-4">
            {ui.useCases.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-card border border-slate-200/80 bg-white px-5 py-4 shadow-soft"
              >
                <Utensils className="h-5 w-5 shrink-0 text-brand-cyan" aria-hidden />
                <span className="font-medium text-brand-navy">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/register" className={`mx-auto mt-10 flex w-fit ${buttonClass("primary", "lg")}`}>
          {pages.common.startFreeTrial}
        </Link>
      </MarketingSection>
      <MarketingSection>
        <SectionHeader title={ui.faqTitle} description={ui.faqDesc} />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqBlock items={[...ui.faq]} />
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title={ui.cta.title}
          description={ui.cta.description}
          primaryHref="/register"
          primaryLabel={ui.cta.primary}
          secondaryHref="/pricing"
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
