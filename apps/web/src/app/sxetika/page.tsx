import Link from "next/link";
import { MarketingAboutContent, MarketingAboutMission } from "@/components/marketing/marketing-about-content";
import { MarketingCtaBand, StatStrip } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("about");
}

export default async function AboutPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = await getMessages(locale);
  const p = marketing.pages.about;
  const ui = pages.about;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="about" />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...marketing.stats]} />
      </MarketingSection>
      <MarketingAboutContent
        content={{
          intro: ui.intro,
          hospitality: ui.hospitality,
          philosophy: ui.philosophy,
          offers: ui.offers,
          atGlance: ui.atGlance,
        }}
      />
      <MarketingSection>
        <MarketingAboutMission title={ui.mission.title} paragraphs={ui.mission.paragraphs} />
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-slate-500">
          {ui.missionNote}
        </p>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonClass("primary")}>
            {ui.trialButton}
          </Link>
          <Link href="/epikoinonia" className={buttonClass("secondary")}>
            {marketing.nav.contact}
          </Link>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title={ui.cta.title}
          description={ui.cta.description}
          primaryHref="/register"
          primaryLabel={ui.cta.primary}
          secondaryHref="/ypiresies"
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
