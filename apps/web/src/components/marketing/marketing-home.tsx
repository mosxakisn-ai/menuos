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
import {
  FaqBlock,
  FeatureCard,
  SectionHeader,
  StatStrip,
} from "@/components/marketing/marketing-blocks";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MARKETING } from "@/content/marketing-el";

const h = MARKETING.home;

const serviceIcons = [QrCode, Globe, Bell, UtensilsCrossed, Building2, Smartphone];

export function MarketingHome() {
  return (
    <>
      <section className="relative overflow-hidden bg-hero-gradient pb-20 pt-16 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000_50%,transparent_100%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <div className="animate-fade-up flex justify-center lg:justify-start">
                <Logo href={false} showTagline markSize={52} />
              </div>
              <h1 className="animate-fade-up mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-navy sm:text-5xl lg:text-6xl">
                {h.hero.title}
                <span className="mt-1 block text-gradient-brand">{h.hero.titleAccent}</span>
              </h1>
              <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
                {h.hero.subtitle}
              </p>
              <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/register" className={buttonClass("primary", "lg")}>
                  {h.hero.ctaTrial}
                </Link>
                <Link href="/pricing" className={buttonClass("secondary", "lg")}>
                  {h.hero.ctaPricing}
                </Link>
              </div>
            </div>

            <div className="animate-float relative mx-auto w-full max-w-sm lg:max-w-none lg:justify-self-end">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-glow backdrop-blur-sm">
                <div className="rounded-card bg-brand-gradient p-5 text-white">
                  <p className="text-lg font-bold">Marine Hotel</p>
                  <p className="text-xs text-white/80">Pool Bar · ΕΛ / EN</p>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { cat: "Signature Cocktails", price: "€12" },
                    { cat: "Light Bites", price: "€8" },
                    { cat: "Wines & Spirits", price: "€9+" },
                  ].map(({ cat, price }) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-xl bg-brand-surface px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-brand-navy">{cat}</span>
                      <span className="font-bold text-brand-blue">{price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-button bg-brand-gradient py-3 text-center text-xs font-bold text-white">
                  Call Waiter · Τραπέζι 12
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatStrip items={[...MARKETING.stats]} />
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionHeader title={h.whatWeDo.title} description={h.whatWeDo.body} />
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{h.whatWeDo.body2}</p>
          <Link href="/ypiresies" className="mt-8 inline-flex text-sm font-semibold text-brand-blue hover:underline">
            Δες όλες τις υπηρεσίες →
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title={h.audiences.title} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {h.audiences.items.map(({ title, text }) => (
              <Card key={title} className="transition hover:-translate-y-0.5 hover:shadow-cardHover">
                <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pos-leitourgei" className="border-y border-slate-100 bg-brand-surface/80 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title={h.steps.title} />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {h.steps.items.map(({ step, title, text }) => (
              <div
                key={step}
                className="rounded-card border border-slate-200/80 bg-white p-6 text-center shadow-card"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white shadow-soft">
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

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title={h.services.title} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {h.services.items.map(({ title, text }, i) => {
              const Icon = serviceIcons[i] ?? QrCode;
              return (
                <FeatureCard key={title} icon={Icon} title={title} description={text} href="/ypiresies" />
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeader title={h.why.title} align="left" className="max-w-none" />
              <ul className="mt-8 space-y-4">
                {h.why.points.map((point) => (
                  <li key={point} className="flex gap-3 text-slate-600">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" aria-hidden />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-brand-blue/10 bg-gradient-to-br from-brand-surface to-white">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Δοκιμή 7 ημερών</p>
              <p className="mt-3 text-2xl font-extrabold text-brand-navy">Ξεκίνα χωρίς ρίσκο</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Δημιούργησε venue, βάλε πιάτα και δοκίμασε το QR με τη δική σου ομάδα πριν επιλέξεις πλάνο.
              </p>
              <Link href="/register" className={`mt-6 inline-flex ${buttonClass("primary")}`}>
                Δωρεάν εγγραφή
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-brand-surface/80 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeader title={h.faq.title} />
          <div className="mt-10">
            <FaqBlock items={[...h.faq.items]} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-brand-gradient py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{h.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">{h.cta.text}</p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-button bg-white px-8 py-3.5 text-sm font-bold text-brand-blue shadow-lg transition hover:bg-brand-surface"
          >
            {h.cta.button}
          </Link>
        </div>
      </section>
    </>
  );
}
