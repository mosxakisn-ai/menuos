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
import { MARKETING } from "@/content/marketing-el";
import { SEO_PAGES, SEO_PRICING_OFFERS } from "@/content/seo-el";
import { buildPricingOffersSchema } from "@/lib/seo-structured-data";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.pricing);

const plans = [
  {
    name: "Δοκιμή",
    price: "€0",
    period: " / 7 ημέρες",
    description: "Για να δοκιμάσεις την πλατφόρμα πριν επιλέξεις πλάνο.",
    features: ["1 venue", "1 menu", "50 πιάτα", "QR codes", "ΕΛ & EN", "Χωρίς κάρτα"],
    cta: "Εγγραφή",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "€29",
    period: "/μήνα",
    description: "Ιδανικό για εστιατόριο, cafe ή μοναδικό venue.",
    features: [
      "1 venue",
      "3 menus",
      "Απεριόριστα πιάτα",
      "QR codes",
      "Call waiter",
      "ΕΛ & EN QR",
    ],
    cta: "Ξεκίνα Basic",
    href: "/register",
    highlighted: true,
    badge: "Δημοφιλές",
  },
  {
    name: "Pro",
    price: "€79",
    period: "/μήνα",
    description: "Για ξενοδοχεία και επιχειρήσεις με πολλαπλούς χώρους.",
    features: [
      "3 venues",
      "Απεριόριστα menus",
      "Call waiter",
      "ΕΛ & EN QR",
      "Προτεραιότητα υποστήριξης",
      "OCR import (σύντομα)",
    ],
    cta: "Ξεκίνα Pro",
    href: "/register",
    highlighted: false,
  },
];

export default function PricingPage() {
  const p = MARKETING.pages.pricing;

  return (
    <MarketingLayout>
      <MarketingPageJsonLd page={SEO_PAGES.pricing} />
      <JsonLdScript data={buildPricingOffersSchema(SEO_PRICING_OFFERS)} />
      <MarketingPageHero title="Απλές, διαφανείς τιμές" subtitle={p.hero} badge={p.badge} />
      <MarketingSection variant="muted">
        <StatStrip items={[...MARKETING.stats]} />
      </MarketingSection>
      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-2xl rounded-card border border-slate-200/80 bg-gradient-to-br from-brand-surface to-white p-8 text-center shadow-card">
          <p className="text-sm font-bold uppercase tracking-wide text-brand-blue">Enterprise</p>
          <h2 className="mt-2 text-2xl font-extrabold text-brand-navy">Custom για αλυσίδες</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            White-label, custom domain, πολλαπλά venues, προτεραιότητα υποστήριξης — επικοινωνήστε για προσφορά
            ανάλογα με τις ανάγκες σας.
          </p>
          <Link href="/epikoinonia" className={`mt-6 inline-flex ${buttonClass("secondary")}`}>
            Ζήτησε προσφορά
          </Link>
        </div>
      </MarketingSection>
      <MarketingSection variant="muted">
        <SectionHeader title="Ερωτήσεις για τιμές" description="Ό,τι χρειάζεστε να ξέρετε πριν ξεκινήσετε." />
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqBlock items={[...p.faq]} />
        </div>
      </MarketingSection>
      <MarketingSection>
        <MarketingCtaBand
          title="Ξεκίνα δωρεάν σήμερα"
          description="7 ημέρες trial. Χωρίς κάρτα. Αναβάθμισε όταν είσαι έτοιμος."
          primaryHref="/register"
          primaryLabel="Δημιουργία λογαριασμού"
          secondaryHref="/epikoinonia"
          secondaryLabel="Ρώτα μας"
        />
      </MarketingSection>
    </MarketingLayout>
  );
}
