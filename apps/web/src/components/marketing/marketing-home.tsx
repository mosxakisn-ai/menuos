import Link from "next/link";
import {
  Bell,
  Building2,
  Check,
  Globe,
  QrCode,
  Smartphone,
  UtensilsCrossed,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MARKETING } from "@/content/marketing-el";

const h = MARKETING.home;

const serviceIcons = [QrCode, Globe, Bell, UtensilsCrossed, Building2, Smartphone];

export function MarketingHome() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3">
              <Logo href={false} showTagline markSize={56} />
            </div>
            <h1 className="animate-fade-up mt-6 text-4xl font-extrabold leading-tight text-brand-navy sm:text-5xl lg:text-6xl">
              {h.hero.title}
              <span className="block text-gradient-brand">{h.hero.titleAccent}</span>
            </h1>
            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              {h.hero.subtitle}
            </p>
            <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className={buttonClass("primary", "lg")}>
                {h.hero.ctaTrial}
              </Link>
              <Link href="/pricing" className={buttonClass("secondary", "lg")}>
                {h.hero.ctaPricing}
              </Link>
            </div>
          </div>

          <div className="animate-float relative mx-auto mt-16 max-w-sm">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-glow">
              <div className="rounded-card bg-brand-gradient p-4 text-white">
                <p className="text-lg font-bold">Marine Hotel</p>
                <p className="text-xs text-white/80">Pool Bar Menu</p>
              </div>
              <div className="mt-4 space-y-3">
                {["Signature Cocktails", "Light Bites", "Wines"].map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-lg bg-brand-surface px-3 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-brand-navy">{cat}</span>
                    <span className="text-brand-cyan">→</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-button bg-brand-gradient py-2.5 text-center text-xs font-bold text-white">
                Call Waiter · Τραπέζι 12
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-b border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{h.whatWeDo.title}</h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{h.whatWeDo.body}</p>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">{h.whatWeDo.body2}</p>
          <Link href="/ypiresies" className="mt-8 inline-flex text-sm font-semibold text-brand-blue hover:underline">
            Δες όλες τις υπηρεσίες →
          </Link>
        </div>
      </section>

      {/* Audiences */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {h.audiences.title}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {h.audiences.items.map(({ title, text }) => (
              <Card key={title}>
                <h3 className="font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="pos-leitourgei" className="border-y border-slate-100 bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {h.steps.title}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {h.steps.items.map(({ step, title, text }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-4 font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center">
            <Link href="/pos-leitourgei" className="text-sm font-semibold text-brand-blue hover:underline">
              Λεπτομέρειες για τη ροή εργασίας →
            </Link>
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {h.services.title}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {h.services.items.map(({ title, text }, i) => {
              const Icon = serviceIcons[i] ?? QrCode;
              return (
                <Card key={title} className="transition hover:shadow-cardHover">
                  <div className="mb-4 inline-flex rounded-button bg-brand-blue/10 p-3 text-brand-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-brand-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">{h.why.title}</h2>
              <ul className="mt-8 space-y-4">
                {h.why.points.map((point) => (
                  <li key={point} className="flex gap-3 text-slate-600">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-brand-surface">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Δοκιμή 14 ημερών</p>
              <p className="mt-3 text-2xl font-extrabold text-brand-navy">Ξεκίνα χωρίς ρίσκο</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Δημιούργησε το πρώτο σου venue, βάλε μερικά πιάτα και δοκίμασε το QR menu με δικούς σου
                ανθρώπους πριν επιλέξεις πλάνο.
              </p>
              <Link href="/register" className={`mt-6 inline-flex ${buttonClass("primary")}`}>
                Δωρεάν εγγραφή
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 bg-brand-surface py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold text-brand-navy">{h.faq.title}</h2>
          <div className="mt-10 space-y-8">
            {h.faq.items.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-bold text-brand-navy">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-gradient py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{h.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">{h.cta.text}</p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-button bg-white px-6 py-3 text-sm font-bold text-brand-blue hover:bg-brand-surface"
          >
            {h.cta.button}
          </Link>
        </div>
      </section>
    </>
  );
}
