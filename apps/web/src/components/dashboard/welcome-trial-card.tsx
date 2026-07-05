"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { formatDashboardDate } from "@/content/dashboard-i18n";

export function WelcomeTrialCard({
  show,
  trialEndsAt,
  trialPeriodDays,
  onboardingComplete = true,
}: {
  show?: boolean;
  trialEndsAt: string | null;
  trialPeriodDays: number;
  onboardingComplete?: boolean;
}) {
  const { d, lang } = useDashboardCopy();
  if (!show) return null;

  const endsLabel = trialEndsAt ? formatDashboardDate(lang, new Date(trialEndsAt)) : null;

  return (
    <Card className="relative overflow-hidden border-brand-blue/20 bg-gradient-to-br from-white via-white to-brand-blue/[0.04] p-5 shadow-card sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(6,182,212,0.08),transparent_50%)]" aria-hidden />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            <Sparkles className="h-4 w-4" aria-hidden />
            {d.trial.welcomeBadge}
          </p>
          <h2 className="mt-2 text-lg font-bold text-brand-navy">{d.trial.welcomeTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{d.welcome}</p>
          {endsLabel ? (
            <p className="mt-3 text-sm font-medium text-brand-navy">
              {d.trial.welcomeEnds(trialPeriodDays, endsLabel)}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{d.trial.welcomeEmailHint}</p>
        </div>
        {onboardingComplete ? (
          <Link href="/dashboard/venues/new" className={`inline-flex shrink-0 items-center gap-1 ${buttonClass("primary", "sm")}`}>
            {d.addVenue}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <p className="shrink-0 rounded-lg border border-brand-blue/15 bg-white/80 px-3 py-2 text-xs font-medium leading-relaxed text-slate-600">
            {d.onboarding.guideIntro}
          </p>
        )}
      </div>
    </Card>
  );
}
