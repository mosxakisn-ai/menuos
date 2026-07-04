"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  PartyPopper,
  QrCode,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardStepCircle } from "@/components/dashboard/dashboard-ui";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { ONBOARDING_STEP_COUNT, shouldShowOnboardingPopup } from "@/lib/onboarding-constants";
import type { CatalogPreviewCategory } from "@/lib/onboarding-status";
import { cn } from "@/lib/utils";

export type OnboardingState = {
  hasVenue: boolean;
  hasCategory: boolean;
  hasItem: boolean;
  venueId?: string;
  venueSlug?: string;
  venueName?: string;
  venueDescription?: string | null;
  itemCount: number;
  menuCount?: number;
  catalogUrl?: string;
  catalogPreview?: CatalogPreviewCategory[];
};

type SetupStepDef = {
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

function firstOpenSetupIndex(steps: SetupStepDef[]): number {
  const open = steps.findIndex((s) => !s.done);
  return open === -1 ? steps.length - 1 : open;
}

export function OnboardingWizard({
  state,
  qrVisited = false,
  needsConfirmation = false,
}: {
  state: OnboardingState;
  qrVisited?: boolean;
  needsConfirmation?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const showPopup = shouldShowOnboardingPopup(pathname);
  const { d } = useDashboardCopy();
  const O = d.onboarding;
  const [confirming, setConfirming] = useState(false);
  const [acknowledgingCatalog, setAcknowledgingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const showSeededCatalogPreview = state.hasVenue && !state.hasItem;

  const setupSteps: SetupStepDef[] = [
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
      desc: showSeededCatalogPreview
        ? O.steps.menu.descSeeded
        : state.hasCategory
          ? O.steps.menu.descWithCategory
          : O.steps.menu.descWithoutCategory,
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: O.steps.menu.cta,
      altHref: showSeededCatalogPreview
        ? undefined
        : state.venueId
          ? `/dashboard/menus/import?venue=${state.venueId}`
          : "/dashboard/menus/import",
      altCta: showSeededCatalogPreview ? undefined : d.importPdf,
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

  const setupComplete = setupSteps.every((s) => s.done);
  const setupDoneCount = setupSteps.filter((s) => s.done).length;
  const showWizard = showPopup && (!setupComplete || needsConfirmation);

  useEffect(() => {
    if (!showWizard) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showWizard]);

  if (!showWizard) return null;

  const onConfirmStep = setupComplete && needsConfirmation;
  const stepIndex = onConfirmStep ? 3 : firstOpenSetupIndex(setupSteps);
  const progressDone = onConfirmStep ? ONBOARDING_STEP_COUNT - 1 : setupDoneCount;
  const progressPct = Math.round((progressDone / ONBOARDING_STEP_COUNT) * 100);

  const stepLabels = O.stepLabels;
  const currentLabel = stepLabels[stepIndex] ?? stepLabels[0]!;

  async function confirmOnboarding() {
    setConfirming(true);
    try {
      const res = await fetch("/api/onboarding/confirm", { method: "POST" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setConfirming(false);
    }
  }

  async function acknowledgeCatalog() {
    setAcknowledgingCatalog(true);
    setCatalogError(null);
    try {
      const res = await fetch("/api/onboarding/mark-catalog", { method: "POST" });
      if (!res.ok) {
        setCatalogError(O.steps.menu.seedFailed);
        return;
      }
      router.refresh();
    } finally {
      setAcknowledgingCatalog(false);
    }
  }

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
            style={{ width: `${Math.max(progressPct, progressDone === 0 ? 8 : progressPct)}%` }}
          />
        </div>

        <div className="border-b border-brand-blue/10 bg-gradient-to-br from-brand-blue/[0.06] to-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-blue">{O.guideLabel}</p>
            <p className="text-xs font-semibold text-brand-blue">{O.completed(progressDone)}</p>
          </div>

          <ol className="mt-3 flex items-center gap-0.5">
            {stepLabels.map((label, i) => {
              const isCurrent = i === stepIndex;
              const isDone = i < 3 ? Boolean(setupSteps[i]?.done) : false;
              const circleState = isDone ? "done" : isCurrent ? "active" : "pending";
              return (
                <li key={label} className="flex min-w-0 flex-1 items-center gap-0.5">
                  {i > 0 ? <span className="h-px min-w-0.5 flex-1 bg-slate-200" aria-hidden /> : null}
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-center",
                      isCurrent && "bg-brand-blue/[0.08]",
                    )}
                  >
                    <DashboardStepCircle state={circleState} index={i + 1} size="sm" />
                    <span
                      className={cn(
                        "w-full truncate text-[9px] font-semibold leading-tight sm:text-[10px]",
                        isDone ? "text-emerald-700" : isCurrent ? "text-brand-navy" : "text-slate-400",
                      )}
                    >
                      {label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-5 py-5">
          {onConfirmStep ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-glow">
                  <PartyPopper className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2 id="onboarding-wizard-title" className="font-serif text-lg font-bold text-brand-navy">
                    {O.steps.done.title}
                  </h2>
                  <p id="onboarding-wizard-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                    {O.steps.done.desc}
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm">
                {state.venueName ? (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <span className="font-semibold text-brand-navy">{O.steps.done.summaryVenue}:</span>{" "}
                      {state.venueName}
                    </span>
                  </li>
                ) : null}
                {state.venueDescription ? (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <span className="font-semibold text-brand-navy">{O.steps.done.summaryDescription}:</span>{" "}
                      {state.venueDescription}
                    </span>
                  </li>
                ) : null}
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-semibold text-brand-navy">{O.steps.done.summaryCatalog}:</span>{" "}
                    {O.steps.done.summaryItems(state.itemCount)}
                    {state.menuCount != null && state.menuCount > 0
                      ? ` · ${O.steps.done.summaryMenus(state.menuCount)}`
                      : null}
                  </span>
                </li>
                {state.catalogUrl ? (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="min-w-0 break-all">
                      <span className="font-semibold text-brand-navy">{O.steps.done.summaryLink}:</span>{" "}
                      <a
                        href={state.catalogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:underline"
                      >
                        {state.catalogUrl}
                      </a>
                    </span>
                  </li>
                ) : null}
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{O.steps.done.summaryQr}</span>
                </li>
              </ul>

              <button
                type="button"
                disabled={confirming}
                onClick={() => void confirmOnboarding()}
                className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 ${buttonClass("primary")}`}
              >
                {confirming ? O.steps.done.confirming : O.steps.done.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              {(() => {
                const step = setupSteps[stepIndex]!;
                const StepIcon = step.icon;
                const isSeededCatalogStep = step.id === "menu" && showSeededCatalogPreview;
                return (
                  <>
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
                          {isSeededCatalogStep ? O.steps.menu.titleSeeded : O.stepHeading(stepIndex + 1, currentLabel)}
                        </h2>
                        <p id="onboarding-wizard-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    {isSeededCatalogStep && state.catalogPreview && state.catalogPreview.length > 0 ? (
                      <div className="mt-4 max-h-52 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                        {state.catalogPreview.map((cat) => (
                          <div key={cat.name}>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{cat.name}</p>
                            <ul className="mt-1.5 space-y-1">
                              {cat.items.map((item) => (
                                <li
                                  key={`${cat.name}-${item.name}`}
                                  className="flex items-center justify-between gap-2 text-sm text-brand-navy"
                                >
                                  <span className="truncate">{item.name}</span>
                                  <span className="shrink-0 font-semibold tabular-nums text-brand-blue">
                                    €{item.price}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {catalogError ? (
                      <p className="mt-3 text-sm font-medium text-red-600">{catalogError}</p>
                    ) : null}

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      {!step.done ? (
                        isSeededCatalogStep ? (
                          <button
                            type="button"
                            disabled={acknowledgingCatalog}
                            onClick={() => void acknowledgeCatalog()}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 ${buttonClass("primary")}`}
                          >
                            {acknowledgingCatalog ? O.steps.menu.acknowledging : O.steps.menu.ctaContinue}
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        ) : (
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
                        )
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          <Check className="h-4 w-4" />
                          {O.stepStatusDone}
                        </span>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
