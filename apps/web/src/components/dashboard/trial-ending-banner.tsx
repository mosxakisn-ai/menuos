"use client";

import Link from "next/link";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import { buttonClass } from "@/components/ui/button";

export function TrialEndingBanner({ trialEndsAt }: { trialEndsAt: string | null }) {
  if (!trialEndsAt) return null;

  const end = new Date(trialEndsAt);
  const now = new Date();
  const msLeft = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

  if (daysLeft <= 0 || daysLeft > 3) return null;

  return (
    <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
      <p>{DASHBOARD_EL.trial.endingSoon(daysLeft)}</p>
      <Link href="/dashboard/billing" className={`mt-3 inline-flex ${buttonClass("primary", "sm")}`}>
        Δες τα πλάνα
      </Link>
    </div>
  );
}
