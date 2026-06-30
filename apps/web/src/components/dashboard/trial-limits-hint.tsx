import Link from "next/link";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import { buttonClass } from "@/components/ui/button";

export function TrialLimitsHint({ plan, itemCount }: { plan: string; itemCount: number }) {
  if (plan !== "TRIAL") return null;

  return (
    <div className="rounded-card border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <p>{DASHBOARD_EL.trial.limits}</p>
      {itemCount >= 40 ? (
        <p className="mt-2 font-medium text-amber-800">
          Έχεις {itemCount}/50 πιάτα στη δοκιμή. Αν χρειάζεσαι περισσότερα, δες τα πλάνα.
        </p>
      ) : null}
      {itemCount >= 40 ? (
        <Link href="/dashboard/billing" className={`mt-2 inline-flex ${buttonClass("secondary", "sm")}`}>
          Δες τα πλάνα
        </Link>
      ) : null}
    </div>
  );
}
