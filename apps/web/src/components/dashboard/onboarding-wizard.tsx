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
      title: O.steps.venue.title,
      desc: O.steps.venue.desc,
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: d.addVenue,
      icon: Store,
    },
    {
      id: "menu",
      title: O.steps.menu.title,
      desc: state.hasCategory ? O.steps.menu.descWithCategory : O.steps.menu.descWithoutCategory,
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: d.editCatalog,
      altHref: state.venueId ? `/dashboard/menus/import?venue=${state.venueId}` : "/dashboard/menus/import",
      altCta: d.importPdf,
      icon: UtensilsCrossed,
    },
    {
      id: "qr",
      title: O.steps.qr.title,
      desc: O.steps.qr.desc,
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: d.qrCodes,
      icon: QrCode,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const stepLabels = O.stepLabels;

  useEffect(() => {
    setViewStep(firstOpenStepIndex(steps));
  }, [completed, state.hasVenue, state.hasItem, qrVisited]);

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
            <p className="mt-1 text-sm font-semibold text-brand-navy">{O.stepOf(viewStep + 1)}</p>
          </div>
          <div className="rounded-full border border-brand-blue/15 bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm">
            {O.completed(completed)}
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
            style={{ width: `${Math.max(progressPct, viewStep === 0 && completed === 0 ? 8 : progressPct)}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {steps.map((s, i) => {
            const circleState = s.done ? "done" : i === viewStep ? "active" : "pending";
            const clickable = s.done || i <= completed;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && setViewStep(i)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl px-1 py-2 text-center transition",
                  i === viewStep && "bg-brand-blue/[0.06]",
                  clickable ? "cursor-pointer hover:bg-brand-blue/[0.04]" : "cursor-default opacity-60",
                )}
              >
                <DashboardStepCircle state={circleState} index={i + 1} size="sm" />
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-tight sm:text-xs",
                    i === viewStep ? "text-brand-navy" : s.done ? "text-emerald-700" : "text-slate-500",
                  )}
                >
                  {stepLabels[i]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            {step.done ? <Check className="h-7 w-7" strokeWidth={2.5} /> : <StepIcon className="h-7 w-7" strokeWidth={2} />}
          </div>

          <h2 className="mt-5 font-serif text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
            {step.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{step.desc}</p>

          {step.done ? (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              <Check className="h-4 w-4" /> {O.done}
            </p>
          ) : null}
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
    </Card>
  );
}
