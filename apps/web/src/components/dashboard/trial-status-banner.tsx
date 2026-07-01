"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { formatTrialDaysLeft, getTrialDaysLeft, getTrialUrgency } from "@menuos/shared";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { formatDashboardDate } from "@/content/dashboard-i18n";
import { cn } from "@/lib/utils";

export function TrialStatusBanner({
  trialEndsAt,
  trialPeriodDays: _trialPeriodDays,
}: {
  trialEndsAt: string;
  trialPeriodDays: number;
}) {
  const { d, lang } = useDashboardCopy();
  const end = new Date(trialEndsAt);
  const daysLeft = getTrialDaysLeft(end);
  if (daysLeft <= 0) return null;

  const urgency = getTrialUrgency(daysLeft);
  const endsLabel = formatDashboardDate(lang, end);
  const daysLabel = formatTrialDaysLeft(daysLeft);

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
    <div className={cn("rounded-xl border px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-5", toneClass)}>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          {headline}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed opacity-90">{d.trial.setupHint}</p>
        <p className="mt-1 text-xs opacity-75">{daysLabel}</p>
      </div>
      <Link
        href="/dashboard/billing"
        className={cn(
          "mt-3 inline-flex shrink-0 sm:mt-0",
          buttonClass(urgency === "healthy" || urgency === "mid" ? "secondary" : "primary", "sm"),
        )}
      >
        {urgency === "healthy" || urgency === "mid" ? d.trial.choosePlan : d.trial.upgradeNow}
      </Link>
    </div>
  );
}
