import {
  Cloud,
  Globe,
  Headphones,
  Monitor,
  QrCode,
  ScanLine,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/marketing/marketing-blocks";
import type { Locale } from "@/i18n/types";
import { cn } from "@/lib/utils";

function philosophyQuoteMarks(locale: Locale): [string, string] {
  return locale === "el" ? ["«", "»"] : ["\u201c", "\u201d"];
}

export type AboutPageContent = {
  hospitality: {
    eyebrow: string;
    title: string;
    lead: string;
    bullets: readonly string[];
    closing: string;
  };
  philosophy: {
    title: string;
    tagline: string;
    paragraphs: readonly string[];
  };
  offers: {
    title: string;
    bullets: readonly string[];
  };
};

const OFFER_ICONS: LucideIcon[] = [QrCode, Globe, Zap, Monitor, Cloud, Headphones];

function AboutSectionShell({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "muted";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative px-4 py-16 sm:px-6 sm:py-20",
        variant === "muted" && "border-y border-slate-100/80 bg-brand-surface/50",
        className,
      )}
    >
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function MarketingAboutContent({
  content,
  locale = "el",
}: {
  content: AboutPageContent;
  locale?: Locale;
}) {
  const [quoteOpen, quoteClose] = philosophyQuoteMarks(locale);
  return (
    <>
      <AboutSectionShell>
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-brand-surface/30 to-cyan-50/25 p-8 shadow-card sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
                {content.hospitality.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">
                {content.hospitality.title}
              </h2>
              <p className="mt-5 text-base leading-[1.75] text-slate-600 sm:text-lg">{content.hospitality.lead}</p>
              <p className="mt-6 rounded-2xl border border-brand-blue/10 bg-white/70 px-4 py-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                {content.hospitality.closing}
              </p>
            </div>
            <ul className="space-y-3">
              {content.hospitality.bullets.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3.5 shadow-soft"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium leading-snug text-brand-navy sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AboutSectionShell>

      <AboutSectionShell variant="muted">
        <SectionHeader title={content.philosophy.title} align="center" className="mx-auto" />
        <figure className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white px-8 py-10 shadow-card sm:px-12 sm:py-12">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-blue via-brand-cyan to-brand-blue"
            aria-hidden
          />
          <blockquote className="relative text-center">
            <p className="text-balance font-serif text-2xl font-semibold leading-snug tracking-tight text-brand-navy sm:text-3xl lg:text-[2rem]">
              {quoteOpen}
              {content.philosophy.tagline}
              {quoteClose}
            </p>
          </blockquote>
        </figure>
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          {content.philosophy.paragraphs.map((para, index) => {
            const Icon = index === 0 ? ScanLine : Settings2;
            return (
              <article
                key={para.slice(0, 48)}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-soft"
              >
                <div className="inline-flex rounded-xl bg-brand-blue/10 p-2.5 text-brand-blue">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-sm leading-[1.75] text-slate-600 sm:text-base">{para}</p>
              </article>
            );
          })}
        </div>
      </AboutSectionShell>

      <AboutSectionShell>
        <SectionHeader title={content.offers.title} align="center" className="mx-auto" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.offers.bullets.map((text, index) => {
            const Icon = OFFER_ICONS[index] ?? Sparkles;
            return (
              <div
                key={text}
                className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft transition hover:border-brand-blue/20 hover:shadow-card"
              >
                <div className="inline-flex rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10 p-2.5 text-brand-blue transition group-hover:from-brand-blue/15 group-hover:to-brand-cyan/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{text}</p>
              </div>
            );
          })}
        </div>
      </AboutSectionShell>
    </>
  );
}

export function MarketingAboutMission({
  title,
  paragraphs,
  supportNote,
}: {
  title: string;
  paragraphs: readonly string[];
  supportNote?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-brand-navy via-[#0f2744] to-[#0c1f38] px-8 py-10 text-white shadow-glow sm:px-12 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_0%,rgba(6,182,212,0.18),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300/90">MenuOS</p>
        <h2 className="mt-3 font-serif text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        <div className="mt-6 space-y-4">
          {paragraphs.map((para) => (
            <p key={para.slice(0, 48)} className="text-base leading-[1.75] text-slate-300 sm:text-lg">
              {para}
            </p>
          ))}
        </div>
        {supportNote ? (
          <p className="mt-8 text-sm leading-relaxed text-slate-400">{supportNote}</p>
        ) : null}
      </div>
    </div>
  );
}
