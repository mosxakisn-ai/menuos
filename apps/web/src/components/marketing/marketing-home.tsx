"use client";

import Link from "next/link";
import {
  ArrowDown,
  Building2,
  Check,
  Globe,
  Orbit,
  QrCode,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useDemoMenuUrl } from "@/lib/demo-menu-url";
import { HeroShowcase } from "@/components/marketing/hero-showcase";
import { HomeLive360 } from "@/components/marketing/home-live-360";
import { MarketingTestimonials } from "@/components/marketing/marketing-testimonials";
import {
  FaqBlock,
  DesignedForStrip,
  FeatureCard,
  SectionHeader,
  StatStrip,
  ValuePill,
} from "@/components/marketing/marketing-blocks";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";

const serviceIcons = [QrCode, Globe, Orbit, UtensilsCrossed, Building2, Smartphone];

export function MarketingHome() {
  const { m } = useI18n();
  const marketing = m.marketing;
  const pages = m.pages;
  const h = marketing.home;
  const demoUrl = useDemoMenuUrl();
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-hero-gradient pb-16 pt-12 sm:pb-24 sm:pt-16">
        {/* Background orbs */}
        <div className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-brand-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000_50%,transparent_100%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10 xl:gap-16">
            {/* Copy */}
            <div className="text-center lg:text-left">
              <div className="animate-fade-up flex justify-center lg:justify-start">
                <ValuePill>
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
                  {h.hero.badge}
                </ValuePill>
              </div>

              <h1 className="animate-fade-up mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-brand-navy sm:text-5xl lg:text-[3.5rem]">
                {h.hero.title}
                <span className="mt-1 block text-gradient-brand">{h.hero.titleAccent}</span>
              </h1>

              <p className="animate-fade-up-delay mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600 opacity-0 lg:mx-0 sm:text-xl">
                {h.hero.subtitle}
              </p>

              <div className="animate-fade-up-delay mt-8 flex flex-wrap items-center justify-center gap-2 opacity-0 lg:justify-start">
                {h.hero.trust.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-soft backdrop-blur-sm"
                  >
                    <Check className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>

              <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row lg:justify-start">
                <Link href="/register" className={`${buttonClass("primary", "lg")} shadow-glow`}>
                  {h.hero.ctaTrial}
                </Link>
                <Link href={demoUrl} className={buttonClass("secondary", "lg")}>
                  {h.hero.ctaDemo}
                </Link>
                <Link href="/pricing" className={`hidden sm:inline-flex ${buttonClass("ghost", "lg")}`}>
                  {h.hero.ctaPricing}
                </Link>
              </div>

              <Link
                href="/pos-leitourgei"
                className="animate-fade-up-delay-2 mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue opacity-0 hover:underline sm:hidden"
              >
                {pages.common.howItWorksLink}
                <ArrowDown className="h-4 w-4" />
              </Link>
            </div>

            {/* Visual */}
            <div className="animate-fade-up-delay-2 opacity-0 lg:justify-self-end">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      <HomeLive360 copy={h.live360} />

      {/* ── Stats ── */}
      <section className="relative border-b border-slate-100 bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <StatStrip items={[...marketing.stats]} />
        </div>
      </section>

      <DesignedForStrip label={pages.common.designedFor} industries={pages.common.industries} />

      <MarketingTestimonials />

      <section className="border-b border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <SectionHeader title={h.whatWeDo.title} description={h.whatWeDo.body} />
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{h.whatWeDo.body2}</p>
          <Link href="/ypiresies" className="mt-8 inline-flex text-sm font-semibold text-brand-blue hover:underline">
            {pages.common.servicesLink}
          </Link>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title={h.audiences.title} />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {h.audiences.items.map(({ title, text }) => (
              <Card key={title} className="group transition hover:-translate-y-1 hover:border-brand-blue/20 hover:shadow-cardHover">
                <h3 className="text-lg font-bold text-brand-navy group-hover:text-brand-blue">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pos-leitourgei" className="border-y border-slate-100 bg-brand-surface/80 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader title={h.steps.title} />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {h.steps.items.map(({ step, title, text }) => (
              <div
                key={step}
                className="group rounded-card border border-slate-200/80 bg-white p-6 text-center shadow-card transition hover:-translate-y-1 hover:shadow-cardHover"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white shadow-glow transition group-hover:scale-110">
                  {step}
                </div>
                <h3 className="mt-4 font-bold text-brand-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center">
            <Link href="/pos-leitourgei" className="text-sm font-semibold text-brand-blue hover:underline">
            {pages.common.howItWorksLink}
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
                <FeatureCard key={title} icon={Icon} title={title} description={text} href="/ypiresies" learnMoreLabel={pages.common.learnMore} />
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
            <Card className="border-brand-blue/10 bg-gradient-to-br from-brand-blue/5 via-white to-brand-cyan/5 shadow-glow">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">{pages.home.trialBadge}</p>
              <p className="mt-3 text-2xl font-extrabold text-brand-navy">{pages.home.trialCardTitle}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{pages.home.trialCardBody}</p>
              <Link href="/register" className={`mt-6 inline-flex ${buttonClass("primary")}`}>
                {pages.common.createAccount}
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
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-brand-cyan/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{h.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">{h.cta.text}</p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-button bg-white px-8 py-3.5 text-sm font-bold text-brand-blue shadow-lg transition hover:scale-[1.02] hover:bg-brand-surface"
          >
            {h.cta.button}
          </Link>
        </div>
      </section>
    </>
  );
}
