"use client";

import Link from "next/link";
import { ArrowRight, Check, QrCode, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { DashboardStepCircle } from "@/components/dashboard/dashboard-ui";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

export type OnboardingState = {
  hasVenue: boolean;
  hasCategory: boolean;
  hasItem: boolean;
  venueId?: string;
  venueSlug?: string;
  itemCount: number;
};

type StepDef = {
  id: string;
  label: string;
  desc: string;
  done: boolean;
  href: string;
  cta: string;
  altHref?: string;
  altCta?: string;
  icon: LucideIcon;
};

function firstOpenStepIndex(steps: StepDef[]): number {
  const open = steps.findIndex((s) => !s.done);
  return open === -1 ? steps.length - 1 : open;
}

export function OnboardingWizard({
  state,
  qrVisited = false,
}: {
  state: OnboardingState;
  qrVisited?: boolean;
}) {
  const { d } = useDashboardCopy();
  const O = d.onboarding;

  const steps: StepDef[] = [
    {
      id: "venue",
      label: O.stepLabels[0]!,
      desc: O.steps.venue.desc,
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: O.steps.venue.cta,
      icon: Store,
    },
    {
      id: "menu",
      label: O.stepLabels[1]!,
      desc: state.hasCategory ? O.steps.menu.descWithCategory : O.steps.menu.descWithoutCategory,
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: O.steps.menu.cta,
      altHref: state.venueId ? `/dashboard/menus/import?venue=${state.venueId}` : "/dashboard/menus/import",
      altCta: d.importPdf,
      icon: UtensilsCrossed,
    },
    {
      id: "qr",
      label: O.stepLabels[2]!,
      desc: O.steps.qr.desc,
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: O.steps.qr.cta,
      icon: QrCode,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed >= 3) return null;

  const stepIndex = firstOpenStepIndex(steps);
  const step = steps[stepIndex]!;
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <div
      role="region"
      aria-label={O.guideLabel}
      className={cn(
        "fixed inset-x-0 z-30 border-t border-brand-blue/15 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md",
        "bottom-[calc(3.75rem+env(safe-area-inset-bottom))] md:bottom-0 md:left-64",
      )}
    >
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-brand-gradient transition-all duration-500"
          style={{ width: `${Math.max(progressPct, completed === 0 ? 8 : progressPct)}%` }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue">{O.guideLabel}</p>
          <p className="text-xs font-semibold text-brand-blue">{O.completed(completed)}</p>
        </div>

        <ol className="mt-2 flex items-center gap-1 sm:gap-2">
          {steps.map((s, i) => {
            const isCurrent = i === stepIndex;
            const circleState = s.done ? "done" : isCurrent ? "active" : "pending";
            return (
              <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                {i > 0 ? <span className="hidden h-px min-w-2 flex-1 bg-slate-200 sm:block" aria-hidden /> : null}
                <div
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 sm:gap-2 sm:px-2",
                    isCurrent && "bg-brand-blue/[0.07]",
                  )}
                >
                  <DashboardStepCircle state={circleState} index={i + 1} size="sm" className="shrink-0" />
                  <span
                    className={cn(
                      "truncate text-[11px] font-semibold leading-tight sm:text-xs",
                      s.done ? "text-emerald-700" : isCurrent ? "text-brand-navy" : "text-slate-400",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-sm leading-snug text-slate-600">
            <span className="font-semibold text-brand-navy">{O.stepHeading(stepIndex + 1, step.label)}</span>
            <span className="hidden sm:inline"> — </span>
            <span className="mt-0.5 block text-xs sm:mt-0 sm:inline sm:text-sm">{step.desc}</span>
          </p>

          <div className="flex shrink-0 flex-wrap gap-2">
            {!step.done ? (
              <>
                <Link
                  href={step.href}
                  className={`inline-flex items-center justify-center gap-1.5 ${buttonClass("primary", "sm")}`}
                >
                  {step.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {step.altHref && step.altCta ? (
                  <Link href={step.altHref} className={buttonClass("secondary", "sm")}>
                    {step.altCta}
                  </Link>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-3.5 w-3.5" />
                {O.stepStatusDone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
