"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileUp, Monitor, type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { buttonClass } from "@/components/ui/button";
import { buildMenusPageUrl } from "@/lib/menus-nav-url";
import { cn } from "@/lib/utils";

function BackLink({ href, label }: { href: string; label: string }) {
  const text = label.replace(/^←\s*/, "");

  return (
    <Link
      href={href}
      className="group mb-6 inline-flex items-center gap-2 rounded-button border border-slate-200/90 bg-white/90 px-3.5 py-2 text-sm font-semibold text-brand-navy shadow-sm backdrop-blur-sm transition hover:border-brand-blue/30 hover:bg-brand-blue/[0.04] hover:text-brand-blue"
    >
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
      {text}
    </Link>
  );
}

function UpgradeFeaturePanel({
  backHref,
  backLabel,
  icon: Icon,
  geminiBadge,
  title,
  lead,
  steps,
  cta,
}: {
  backHref: string;
  backLabel: string;
  icon: LucideIcon;
  geminiBadge?: string;
  title: string;
  lead: string;
  steps: readonly string[];
  cta: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-blue/15 bg-white shadow-card">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-cyan/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-brand-blue/10 blur-3xl"
        aria-hidden
      />

      <div className="relative border-b border-slate-100/80 bg-gradient-to-br from-brand-blue/[0.04] via-white to-cyan-50/30 px-5 py-5 sm:px-8 sm:py-6">
        <BackLink href={backHref} label={backLabel} />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow ring-4 ring-white">
            <Icon className="h-7 w-7 text-white" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ProBadge size="sm" />
              {geminiBadge ? (
                <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-800 ring-1 ring-violet-200/70">
                  {geminiBadge}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">{lead}</p>
          </div>
        </div>
      </div>

      <div className="relative px-5 py-5 sm:px-8 sm:py-6">
        <ul className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className={cn(
                "flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-sm leading-snug text-slate-700",
                index === 0 && geminiBadge && "border-violet-100/80 bg-violet-50/40",
              )}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>

        <a
          href="#plans"
          className={`mt-6 inline-flex items-center gap-2 ${buttonClass("primary")}`}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}

export function UpgradeReasonBanner() {
  const { d } = useDashboardCopy();
  const searchParams = useSearchParams();
  const reason = searchParams.get("upgrade");
  const catalogBackHref = buildMenusPageUrl({
    venueId: searchParams.get("venue") ?? undefined,
    menuId: searchParams.get("menu") ?? undefined,
  });

  if (reason === "pdf-import") {
    const copy = d.upgrade.pdfImport;
    return (
      <UpgradeFeaturePanel
        backHref={catalogBackHref}
        backLabel={d.pages.import.backToCatalog}
        icon={FileUp}
        geminiBadge={copy.geminiBadge}
        title={copy.title}
        lead={copy.lead}
        steps={copy.steps}
        cta={copy.cta}
      />
    );
  }

  if (reason === "live-360") {
    const copy = d.upgrade.live360;
    return (
      <UpgradeFeaturePanel
        backHref="/dashboard"
        backLabel={d.proFeature.live360.back}
        icon={Monitor}
        title={copy.title}
        lead={copy.lead}
        steps={copy.steps}
        cta={copy.cta}
      />
    );
  }

  return null;
}
