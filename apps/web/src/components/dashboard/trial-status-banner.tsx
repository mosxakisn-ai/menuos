"use client";

import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  computeTrialGraceEndsAt,
  getTrialAccessPhase,
  getTrialDaysLeft,
  getTrialGraceDaysLeft,
  getTrialGraceUrgency,
  getTrialUrgency,
  isTrialPlan,
} from "@menuos/shared";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { formatDashboardDate } from "@/content/dashboard-i18n";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrialStatusBanner({
  trialEndsAt,
  trialPeriodDays: _trialPeriodDays,
  planId,
  itemCount = 0,
  onboardingLocked = false,
}: {
  trialEndsAt: string;
  trialPeriodDays: number;
  planId: string;
  itemCount?: number;
  onboardingLocked?: boolean;
}) {
  const { d, lang } = useDashboardCopy();
  if (!isTrialPlan(planId)) return null;

  const trialEnd = new Date(trialEndsAt);
  const phase = getTrialAccessPhase(trialEnd);
  if (phase === "expired") return null;

  if (phase === "grace") {
    const graceDaysLeft = getTrialGraceDaysLeft(trialEnd);
    const graceEndsAt = computeTrialGraceEndsAt(trialEnd);
    const graceEndsLabel = formatDashboardDate(lang, graceEndsAt);
    const urgency = getTrialGraceUrgency(graceDaysLeft);

    const toneClass =
      urgency === "last_day"
        ? "border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50/80 to-white text-orange-950"
        : urgency === "ending"
          ? "border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white text-amber-950"
          : "border-violet-200 bg-gradient-to-br from-violet-50/80 via-brand-blue/[0.04] to-white text-brand-navy";

    const headline =
      urgency === "last_day"
        ? d.trial.bannerGraceLastDay
        : d.trial.bannerGrace(graceDaysLeft, graceEndsLabel);

    return (
      <div className={cn("rounded-xl border px-4 py-3.5 sm:px-5", toneClass)}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
          {headline}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed opacity-90">{d.trial.graceHint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link href="/dashboard/billing" className={buttonClass("primary", "sm")}>
            {d.trial.graceChoosePlan}
          </Link>
          <span className="text-xs opacity-75">{d.trial.graceUntil(graceEndsLabel)}</span>
        </div>
      </div>
    );
  }

  const daysLeft = getTrialDaysLeft(trialEnd);
  if (daysLeft <= 0) return null;

  const urgency = getTrialUrgency(daysLeft);
  const endsLabel = formatDashboardDate(lang, trialEnd);

  const toneClass =
    urgency === "last_day"
      ? "border-orange-300 bg-orange-50 text-orange-950"
      : urgency === "ending"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : urgency === "mid"
          ? "border-sky-200 bg-sky-50 text-sky-950"
          : "border-brand-blue/25 bg-brand-blue/5 text-brand-navy";

  const headline =
    urgency === "last_day"
      ? d.trial.bannerLastDay
      : urgency === "ending"
        ? d.trial.bannerEnding(daysLeft, endsLabel)
        : urgency === "mid"
          ? d.trial.bannerMid(daysLeft, endsLabel)
          : d.trial.bannerHealthy(daysLeft, endsLabel);

  return (
    <div className={cn("rounded-xl border px-4 py-3 sm:px-5", toneClass)}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Clock className="h-4 w-4 shrink-0" aria-hidden />
        {headline}
      </p>
      {!onboardingLocked ? (
        <p className="mt-1.5 text-sm leading-relaxed opacity-90">{d.trial.setupHint}</p>
      ) : null}
      <p className="mt-1.5 text-xs leading-relaxed opacity-80">{d.trial.limits}</p>
      {urgency === "last_day" || urgency === "ending" ? (
        <p className="mt-1.5 text-xs leading-relaxed opacity-80">{d.trial.gracePromise}</p>
      ) : null}
      {itemCount >= 40 ? (
        <p className="mt-1.5 text-xs font-medium text-amber-800">{d.trial.limitsNear(itemCount)}</p>
      ) : null}
    </div>
  );
}
