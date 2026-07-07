import Link from "next/link";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { MarketingAboutContent, MarketingAboutMission } from "@/components/marketing/marketing-about-content";
import { MarketingCtaBand, SectionHeader, StatStrip } from "@/components/marketing/marketing-blocks";
import {
  MarketingLayout,
  MarketingPageHero,
  MarketingSeoIntro,
  MarketingSection,
} from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("about");
}

const valueIcons = [Sparkles, MapPin, Heart];

export default async function AboutPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = await getMessages(locale);
  const p = marketing.pages.about;
  const ui = pages.about;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="about" />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      <MarketingSeoIntro lead={ui.intro[0]} paragraphs={ui.intro.slice(1)} />
      <MarketingSection variant="muted">
        <StatStrip items={[...marketing.stats]} />
      </MarketingSection>
      <MarketingAboutContent
        content={{
          hospitality: ui.hospitality,
          philosophy: ui.philosophy,
          offers: ui.offers,
        }}
      />
      <MarketingSection variant="muted">
        <SectionHeader title={ui.valuesTitle} align="center" className="mx-auto" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {p.values.map(({ title, text }, i) => {
            const Icon = valueIcons[i] ?? Sparkles;
            return (
              <article
                key={title}
                className="rounded-[1.25rem] border border-slate-200/80 bg-white p-6 text-center shadow-card transition hover:shadow-cardHover"
              >
                <div className="mx-auto inline-flex rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>
      <MarketingSection>
        <MarketingAboutMission
          title={ui.mission.title}
          paragraphs={ui.mission.paragraphs}
          supportNote={ui.missionNote}
        />
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
