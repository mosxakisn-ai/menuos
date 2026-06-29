import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description: "MenuOS pricing — Basic, Pro, and Enterprise plans for digital QR menus.",
  path: "/pricing",
});

const plans = [
  {
    name: "Trial",
    price: "€0",
    period: "14 days",
    features: ["1 venue", "1 menu", "50 items", "QR codes"],
  },
  {
    name: "Basic",
    price: "€29",
    period: "/month",
    features: ["1 venue", "3 menus", "Unlimited items", "QR codes", "Call waiter"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "€79",
    period: "/month",
    features: [
      "3 venues",
      "Unlimited menus",
      "OCR import",
      "Web push",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-primary">Simple pricing</h1>
            <p className="mt-4 text-slate-600">Start free. Upgrade when you grow.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? "border-primary shadow-glow ring-2 ring-primary/20" : ""}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-primary/70">
                  {plan.name}
                </p>
                <p className="mt-4 font-serif text-4xl font-bold text-primary">
                  {plan.price}
                  <span className="text-base font-normal text-slate-500">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full text-center ${buttonClass(plan.highlighted ? "primary" : "secondary")}`}
                >
                  Get started
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
