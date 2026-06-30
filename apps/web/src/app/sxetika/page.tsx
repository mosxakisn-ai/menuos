import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { MarketingCtaBand, SectionHeader, StatStrip } from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES } from "@/content/seo-el";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.about);

const valueIcons = [Sparkles, MapPin, Heart];

export default async function AboutPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = getMessages(locale);
  const p = marketing.pages.about;
  const ui = pages.about;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.about} />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...marketing.stats]} />
      </MarketingSection>
      <MarketingSection>
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-slate-600">
          {ui.paragraphs.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <SectionHeader title={ui.valuesTitle} description={ui.valuesDesc} />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {p.values.map(({ title, text }, i) => {
            const Icon = valueIcons[i] ?? Sparkles;
            return (
              <article key={title} className="rounded-card border border-slate-200/80 bg-white p-6 shadow-card">
                <div className="inline-flex rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
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
        <div className="mx-auto max-w-3xl rounded-card border border-slate-200 bg-gradient-to-br from-brand-surface to-white p-8 sm:p-10">
          <h2 className="text-2xl font-extrabold text-brand-navy">{ui.missionTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{ui.missionBody}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">{ui.missionNote}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={buttonClass("primary")}>
              {ui.trialButton}
            </Link>
            <Link href="/epikoinonia" className={buttonClass("secondary")}>
              {marketing.nav.contact}
            </Link>
          </div>
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
