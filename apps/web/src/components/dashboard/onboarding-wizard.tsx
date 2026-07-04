"use client";

import Link from "next/link";
import { ArrowRight, Check, QrCode, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
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
  showPopup = false,
}: {
  state: OnboardingState;
  qrVisited?: boolean;
  /** Modal popup — only on overview so it never covers forms. */
  showPopup?: boolean;
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

  useEffect(() => {
    if (!showPopup || completed >= 3) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPopup, completed]);

  if (!showPopup || completed >= 3) return null;

  const stepIndex = firstOpenStepIndex(steps);
  const step = steps[stepIndex]!;
  const StepIcon = step.icon;
  const progressPct = Math.round((completed / steps.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center"
      role="presentation"
    >
      <div className="absolute inset-0 bg-brand-navy/45 backdrop-blur-[2px]" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-wizard-title"
        aria-describedby="onboarding-wizard-desc"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-brand-blue/15 bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)]"
      >
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-brand-gradient transition-all duration-500"
            style={{ width: `${Math.max(progressPct, completed === 0 ? 8 : progressPct)}%` }}
          />
        </div>

        <div className="border-b border-brand-blue/10 bg-gradient-to-br from-brand-blue/[0.06] to-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue">{O.guideLabel}</p>
            <p className="text-xs font-semibold text-brand-blue">{O.completed(completed)}</p>
          </div>

          <ol className="mt-3 flex items-center gap-1">
            {steps.map((s, i) => {
              const isCurrent = i === stepIndex;
              const circleState = s.done ? "done" : isCurrent ? "active" : "pending";
              return (
                <li key={s.id} className="flex min-w-0 flex-1 items-center gap-1">
                  {i > 0 ? <span className="h-px min-w-1 flex-1 bg-slate-200" aria-hidden /> : null}
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center",
                      isCurrent && "bg-brand-blue/[0.08]",
                    )}
                  >
                    <DashboardStepCircle state={circleState} index={i + 1} size="sm" />
                    <span
                      className={cn(
                        "w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px]",
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
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
              {step.done ? (
                <Check className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <StepIcon className="h-5 w-5" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="onboarding-wizard-title" className="font-serif text-lg font-bold text-brand-navy">
                {O.stepHeading(stepIndex + 1, step.label)}
              </h2>
              <p id="onboarding-wizard-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                {step.desc}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {!step.done ? (
              <>
                <Link
                  href={step.href}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 ${buttonClass("primary")}`}
                >
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {step.altHref && step.altCta ? (
                  <Link href={step.altHref} className={`flex-1 ${buttonClass("secondary")}`}>
                    {step.altCta}
                  </Link>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-4 w-4" />
                {O.stepStatusDone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
