"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, QrCode, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardStepCircle } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
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
  title: string;
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

function stepStatusLabel(
  done: boolean,
  isCurrent: boolean,
  O: { stepStatusDone: string; stepStatusCurrent: string; stepStatusPending: string },
): string {
  if (done) return O.stepStatusDone;
  if (isCurrent) return O.stepStatusCurrent;
  return O.stepStatusPending;
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
  const [viewStep, setViewStep] = useState(0);

  const steps: StepDef[] = [
    {
      id: "venue",
      label: O.stepLabels[0]!,
      title: O.steps.venue.title,
      desc: O.steps.venue.desc,
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: O.steps.venue.cta,
      icon: Store,
    },
    {
      id: "menu",
      label: O.stepLabels[1]!,
      title: O.steps.menu.title,
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
      title: O.steps.qr.title,
      desc: O.steps.qr.desc,
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: O.steps.qr.cta,
      icon: QrCode,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const currentStepIndex = firstOpenStepIndex(steps);

  useEffect(() => {
    setViewStep(currentStepIndex);
  }, [completed, state.hasVenue, state.hasItem, qrVisited, currentStepIndex]);

  if (completed >= 3) return null;

  const step = steps[viewStep]!;
  const StepIcon = step.icon;
  const progressPct = Math.round((completed / steps.length) * 100);
  const canGoBack = viewStep > 0;
  const canGoNext = step.done && viewStep < steps.length - 1;

  return (
    <Card className="overflow-hidden border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.06] via-white to-brand-cyan/[0.08] shadow-card">
      <div className="border-b border-brand-blue/10 bg-white/70 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">{O.guideLabel}</p>
            <p className="mt-1 text-sm font-semibold text-brand-navy">{O.guideIntro}</p>
          </div>
          <div className="rounded-full border border-brand-blue/15 bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm">
            {O.completed(completed)}
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPct, completed === 0 ? 8 : progressPct)}%` }}
          />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,240px)_1fr]">
        <div className="border-b border-brand-blue/10 bg-white/50 px-5 py-4 lg:border-b-0 lg:border-r sm:px-6">
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const isCurrent = i === currentStepIndex;
              const circleState = s.done ? "done" : isCurrent ? "active" : "pending";
              const clickable = s.done || isCurrent;
              const status = stepStatusLabel(s.done, isCurrent, O);

              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => clickable && setViewStep(i)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      isCurrent && "bg-brand-blue/[0.08] ring-1 ring-brand-blue/15",
                      clickable ? "cursor-pointer hover:bg-brand-blue/[0.04]" : "cursor-default opacity-55",
                    )}
                  >
                    <DashboardStepCircle state={circleState} index={i + 1} size="sm" className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {O.stepOf(i + 1)}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-sm font-semibold leading-snug",
                          s.done ? "text-emerald-700" : isCurrent ? "text-brand-navy" : "text-slate-600",
                        )}
                      >
                        {s.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[11px] font-semibold",
                          s.done
                            ? "text-emerald-600"
                            : isCurrent
                              ? "text-brand-blue"
                              : "text-slate-400",
                        )}
                      >
                        {status}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-brand-blue">
            {O.stepHeading(viewStep + 1, step.label)}
          </p>

          <div className="mx-auto mt-5 max-w-lg text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              {step.done ? (
                <Check className="h-7 w-7" strokeWidth={2.5} />
              ) : (
                <StepIcon className="h-7 w-7" strokeWidth={2} />
              )}
            </div>

            <h2 className="mt-5 font-serif text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
              {step.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{step.desc}</p>

            {step.done ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                <Check className="h-4 w-4" /> {O.stepStatusDone}
              </p>
            ) : (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue ring-1 ring-brand-blue/15">
                {O.stepStatusCurrent}
              </p>
            )}
          </div>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            {!step.done ? (
              <>
                <Link
                  href={step.href}
                  className={`inline-flex items-center justify-center gap-2 ${buttonClass("primary")}`}
                >
                  {step.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {step.altHref && step.altCta ? (
                  <Link href={step.altHref} className={buttonClass("secondary")}>
                    {step.altCta}
                  </Link>
                ) : null}
              </>
            ) : canGoNext ? (
              <button
                type="button"
                onClick={() => setViewStep(viewStep + 1)}
                className={`inline-flex items-center justify-center gap-2 ${buttonClass("primary")}`}
              >
                {O.nextStep}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mx-auto mt-6 flex max-w-md items-center justify-between gap-3">
            {canGoBack ? (
              <button
                type="button"
                onClick={() => setViewStep(viewStep - 1)}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-navy ${buttonClass("ghost", "sm")}`}
              >
                <ArrowLeft className="h-4 w-4" />
                {O.backStep}
              </button>
            ) : (
              <span />
            )}
            {step.done && !canGoNext && state.hasItem && state.venueSlug ? (
              <p className="text-right text-sm text-slate-600">
                {O.previewIntro}{" "}
                <a
                  href={`/m/${state.venueSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-blue hover:underline"
                >
                  {O.openCatalog}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
