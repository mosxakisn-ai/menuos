import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { MarketingPageJsonLd } from "@/components/seo/marketing-json-ld";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { SEO_PAGES, SEO_PRICING_OFFERS } from "@/content/seo-el";
import { buildPricingOffersSchema } from "@/lib/seo-structured-data";
import { seoPageMetadata } from "@/lib/seo";

export const metadata: Metadata = seoPageMetadata(SEO_PAGES.pricing);

const plans = [
  {
    name: "Δοκιμή",
    price: "€0",
    period: "14 ημέρες",
    features: ["1 venue", "1 menu", "50 πιάτα", "QR codes", "4 γλώσσες"],
    cta: "Εγγραφή",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "€29",
    period: "/μήνα",
    features: [
      "1 venue",
      "3 menus",
      "Απεριόριστα πιάτα",
      "QR codes",
      "Call waiter",
      "4 γλώσσες",
    ],
    cta: "Ξεκίνα Basic",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "€79",
    period: "/μήνα",
    features: [
      "3 venues",
      "Απεριόριστα menus",
      "Call waiter",
      "4 γλώσσες",
      "Προτεραιότητα υποστήριξης",
      "Ιδανικό για ξενοδοχεία",
    ],
    cta: "Ξεκίνα Pro",
    href: "/register",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingPageJsonLd page={SEO_PAGES.pricing} />
      <JsonLdScript data={buildPricingOffersSchema(SEO_PRICING_OFFERS)} />
      <SiteHeader />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-brand-navy">Απλές τιμές</h1>
            <p className="mt-4 text-lg text-slate-600">
              Ξεκίνα δωρεάν. Αναβάθμισε όταν το menu σου μεγαλώσει — χωρίς δεσμεύσεις ετών.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? "border-brand-blue shadow-glow ring-2 ring-brand-blue/20" : ""}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue/70">{plan.name}</p>
                <p className="mt-4 text-4xl font-extrabold text-brand-navy">
                  {plan.price}
                  <span className="text-base font-normal text-slate-500">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full text-center ${buttonClass(plan.highlighted ? "primary" : "secondary")}`}
                >
                  {plan.cta}
                </Link>
              </Card>
            ))}
          </div>
          <div className="mx-auto mt-14 max-w-2xl rounded-card bg-brand-surface p-8 text-center">
            <h2 className="text-xl font-bold text-brand-navy">Enterprise</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Για αλυσίδες, white-label ή custom domain — επικοινωνήστε μαζί μας για προσφορά ανάλογα με τις
              ανάγκες σας.
            </p>
            <Link href="/epikoinonia" className={`mt-4 inline-flex ${buttonClass("secondary")}`}>
              Ζήτησε προσφορά
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
