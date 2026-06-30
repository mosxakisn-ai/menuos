import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL } from "@/content/dashboard-el";

export function WelcomeTrialCard({
  show,
  trialEndsAt,
  trialPeriodDays,
}: {
  show?: boolean;
  trialEndsAt: string | null;
  trialPeriodDays: number;
}) {
  if (!show) return null;

  const endsLabel = trialEndsAt ? new Date(trialEndsAt).toLocaleDateString("el-GR") : null;

  return (
    <Card className="border-brand-blue/25 bg-gradient-to-br from-brand-blue/5 to-brand-cyan/5 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-blue">
            <Sparkles className="h-4 w-4" aria-hidden />
            {DASHBOARD_EL.trial.welcomeBadge}
          </p>
          <h2 className="mt-2 text-lg font-bold text-brand-navy">{DASHBOARD_EL.trial.welcomeTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{DASHBOARD_EL.welcome}</p>
          {endsLabel ? (
            <p className="mt-3 text-sm font-medium text-brand-navy">
              {DASHBOARD_EL.trial.welcomeEnds(trialPeriodDays, endsLabel)}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{DASHBOARD_EL.trial.welcomeEmailHint}</p>
        </div>
        <Link href="/dashboard/venues/new" className={`inline-flex shrink-0 items-center gap-1 ${buttonClass("primary", "sm")}`}>
          {DASHBOARD_EL.addVenue}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
