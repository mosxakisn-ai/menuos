"use client";

import Link from "next/link";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";

export function TrialLimitsHint({ plan, itemCount }: { plan: string; itemCount: number }) {
  const { d } = useDashboardCopy();
  if (plan !== "TRIAL") return null;

  return (
    <div className="rounded-card border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p>{d.trial.limits}</p>
      {itemCount >= 40 ? (
        <p className="mt-2 font-medium text-amber-800">{d.trial.limitsNear(itemCount)}</p>
      ) : null}
      {itemCount >= 40 ? (
        <Link href="/dashboard/billing" className={`mt-2 inline-flex ${buttonClass("secondary", "sm")}`}>
          {d.trial.limitsNearCta}
        </Link>
      ) : null}
    </div>
  );
}
