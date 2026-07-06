import {
  Bell,
  FileText,
  Globe,
  LayoutDashboard,
  Orbit,
  Palette,
  QrCode,
  Shield,
  UtensilsCrossed,
} from "lucide-react";
import {
  FeatureCard,
  MarketingCtaBand,
  SectionHeader,
  StatStrip,
} from "@/components/marketing/marketing-blocks";
import { MarketingLayout, MarketingPageHero, MarketingSection } from "@/components/marketing/marketing-layout";
import { MarketingServicesIntro } from "@/components/marketing/marketing-services-intro";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { getMessages } from "@/i18n/get-messages";
import { getServerLocale } from "@/i18n/server";
import { generateMarketingMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return generateMarketingMetadata("services");
}

const serviceIcons = [QrCode, LayoutDashboard, UtensilsCrossed, FileText, Globe, Bell, Orbit, QrCode, Palette, Shield];

export default async function ServicesPage() {
  const locale = await getServerLocale();
  const { marketing, pages } = await getMessages(locale);
  const p = marketing.pages.services;
  const ui = pages.services;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd pageKey="services" />
      <MarketingPageHero title={ui.heroTitle} subtitle={p.hero} badge={p.badge} />
      {"introBlock" in p ? <MarketingServicesIntro content={p.introBlock} /> : null}
      <MarketingSection variant="muted">
        <StatStrip items={[...marketing.stats]} />
      </MarketingSection>
      <MarketingSection>
        <SectionHeader title={ui.sectionTitle} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {ui.items.map((s, i) => {
            const Icon = serviceIcons[i] ?? QrCode;
            return <FeatureCard key={s.title} icon={Icon} {...s} learnMoreLabel={pages.common.learnMore} />;
          })}
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <MarketingCtaBand
          title={ui.cta.title}
          description={ui.cta.description}
          primaryHref="/register"
          primaryLabel={ui.cta.primary}
          secondaryHref="/pos-leitourgei"
          secondaryLabel={ui.cta.secondary}
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
