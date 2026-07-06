import Link from "next/link";
import { ArrowRight, Check, Sparkles, TrendingDown, Zap } from "lucide-react";

export type ServicesIntroContent = {
  pill: string;
  title: string;
  subtitle: string;
  features: readonly string[];
  qrParagraph: string;
  proTitle: string;
  proItems: readonly string[];
  savingsTitle: string;
  savingsParagraphs: readonly string[];
  closing: string;
  ctaLabel: string;
  ctaHref: string;
};

export function MarketingServicesIntro({ content }: { content: ServicesIntroContent }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-900 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.22),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_50%,rgba(37,99,235,0.12),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {content.pill}
          </p>
          <h2 className="mt-6 text-balance text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.65rem]">
            {content.title}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-300 sm:text-xl">{content.subtitle}</p>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:gap-4">
          {content.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-sm font-medium leading-snug text-slate-100 sm:text-base">{feature}</span>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-slate-400 sm:text-lg">
          {content.qrParagraph}
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="relative rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-blue-600/10 p-6 sm:p-8">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" aria-hidden />
            <div className="flex items-center gap-2 text-cyan-300">
              <Zap className="h-5 w-5" aria-hidden />
              <h3 className="text-lg font-bold sm:text-xl">{content.proTitle}</h3>
            </div>
            <ul className="mt-5 space-y-4">
              {content.proItems.map((item) => (
                <li key={item.slice(0, 40)} className="flex gap-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-300">
              <TrendingDown className="h-5 w-5" aria-hidden />
              <h3 className="text-lg font-bold sm:text-xl">{content.savingsTitle}</h3>
            </div>
            <div className="mt-5 space-y-4">
              {content.savingsParagraphs.map((para) => (
                <p key={para.slice(0, 48)} className="text-sm leading-relaxed text-slate-400 sm:text-base">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-6 border-t border-white/10 pt-10 text-center">
          <p className="max-w-2xl text-balance text-lg font-semibold leading-relaxed text-white sm:text-xl">
            {content.closing}
          </p>
          <Link
            href={content.ctaHref}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 text-sm font-bold text-white shadow-[0_8px_32px_rgba(6,182,212,0.35)] transition hover:brightness-110 sm:text-base"
          >
            {content.ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
