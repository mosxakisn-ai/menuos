import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Building2, Check, Coffee, ConciergeBell, UtensilsCrossed, Waves } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export function StatStrip({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(({ value, label }) => (
        <div
          key={label}
          className="rounded-card border border-slate-200/80 bg-white/80 px-4 py-5 text-center shadow-soft backdrop-blur-sm"
        >
          <p className="text-2xl font-extrabold text-gradient-brand sm:text-3xl">{value}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

const DESIGNED_FOR_ICONS = [Building2, UtensilsCrossed, Waves, Coffee, ConciergeBell] as const;

export function DesignedForStrip({
  label,
  industries,
}: {
  label: string;
  industries: readonly string[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/80 to-white py-12 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,rgba(37,99,235,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <span
            className="h-px w-10 bg-gradient-to-r from-transparent via-slate-300 to-brand-blue/30 sm:w-24"
            aria-hidden
          />
          <p className="shrink-0 text-center text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">
            {label}
          </p>
          <span
            className="h-px w-10 bg-gradient-to-l from-transparent via-slate-300 to-brand-blue/30 sm:w-24"
            aria-hidden
          />
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {industries.map((name, index) => {
            const Icon = DESIGNED_FOR_ICONS[index] ?? Building2;
            return (
              <li key={name}>
                <div className="group flex h-full flex-col items-center rounded-2xl border border-slate-200/70 bg-white/95 px-3 py-5 text-center shadow-soft backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-blue/20 hover:shadow-card sm:px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy/[0.04] via-brand-blue/10 to-brand-cyan/15 text-brand-blue shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-brand-blue/10 transition duration-300 group-hover:scale-[1.04] group-hover:ring-brand-cyan/25">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="mt-3.5 text-sm font-semibold leading-snug text-slate-700 transition group-hover:text-brand-navy">
                    {name}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  bullets,
  href,
  className,
  learnMoreLabel = "Μάθε περισσότερα",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: readonly string[];
  href?: string;
  className?: string;
  learnMoreLabel?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-card border border-slate-200/80 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-brand-blue/20 hover:shadow-cardHover",
        className,
      )}
    >
      <div className="inline-flex rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-cyan/10 p-3 text-brand-blue ring-1 ring-brand-blue/10">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
      {bullets?.length ? (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-slate-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
        >
          {learnMoreLabel}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ) : null}
    </article>
  );
}

export function TimelineStep({
  step,
  title,
  body,
  detail,
  isLast = false,
}: {
  step: string;
  title: string;
  body: string;
  detail?: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-6 pb-12 last:pb-0">
      {!isLast ? (
        <div className="absolute left-[1.35rem] top-14 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-brand-blue/40 to-transparent" />
      ) : null}
      <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow ring-4 ring-white">
        {step}
      </div>
      <div className="min-w-0 flex-1 rounded-card border border-slate-200/80 bg-white p-6 shadow-card">
        <h3 className="text-xl font-bold text-brand-navy">{title}</h3>
        <p className="mt-3 leading-relaxed text-slate-600">{body}</p>
        {detail ? (
          <p className="mt-3 rounded-lg bg-brand-surface px-4 py-3 text-sm leading-relaxed text-slate-600">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function FaqBlock({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-slate-200/80 rounded-card border border-slate-200/80 bg-white shadow-card">
      {items.map(({ q, a }) => (
        <details key={q} className="group px-6 py-5 open:bg-brand-surface/50">
          <summary className="cursor-pointer list-none font-bold text-brand-navy marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              {q}
              <span className="mt-0.5 text-brand-blue transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 pr-8 text-sm leading-relaxed text-slate-600">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function MarketingCtaBand({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.25rem] bg-brand-gradient px-6 py-12 text-center text-white sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="relative">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/90">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex rounded-button bg-white px-6 py-3 text-sm font-bold text-brand-blue shadow-lg transition hover:bg-brand-surface"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex rounded-button border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ValuePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-blue/15 bg-brand-blue/5 px-3 py-1 text-xs font-semibold text-brand-blue">
      {children}
    </span>
  );
}

export function PricingFeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {features.map((f) => (
        <li key={f} className="flex gap-2.5 text-sm text-slate-600">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlighted = false,
  badge,
}: {
  name: string;
  price: string;
  period: string;
  description?: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-card border bg-white p-8 shadow-card transition hover:shadow-cardHover",
        highlighted
          ? "border-brand-blue shadow-glow ring-2 ring-brand-blue/15"
          : "border-slate-200/80",
      )}
    >
      {badge ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-white">
          {badge}
        </span>
      ) : null}
      <p className="text-sm font-bold uppercase tracking-wide text-brand-blue/80">{name}</p>
      <p className="mt-4 text-4xl font-extrabold tracking-tight text-brand-navy">
        {price}
        <span className="text-base font-normal text-slate-500">{period}</span>
      </p>
      {description ? <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p> : null}
      <PricingFeatureList features={features} />
      <Link
        href={href}
        className={`mt-8 block w-full text-center ${buttonClass(highlighted ? "primary" : "secondary")}`}
      >
        {cta}
      </Link>
    </article>
  );
}
