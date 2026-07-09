"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isPaidPlan } from "@menuos/shared";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { formatDashboardDate } from "@/content/dashboard-i18n";
import { confirmWarning } from "@/lib/confirm-action";

type Props = {
  subscription: {
    plan: string;
    status: string;
    stripeSubId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  subscriptionAccessActive: boolean;
  userRole?: string;
};

export function BillingRenewalControl({
  subscription,
  subscriptionAccessActive,
  userRole,
}: Props) {
  const { d, lang } = useDashboardCopy();
  const R = d.billing.renewal;
  const router = useRouter();
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(
    subscription?.cancelAtPeriodEnd ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage =
    userRole !== "STAFF" &&
    subscriptionAccessActive &&
    subscription &&
    isPaidPlan(subscription.plan) &&
    Boolean(subscription.stripeSubId);

  if (!canManage) return null;

  const periodEndLabel = subscription.currentPeriodEnd
    ? formatDashboardDate(lang, new Date(subscription.currentPeriodEnd))
    : null;

  async function updateRenewal(nextCancelAtPeriodEnd: boolean) {
    if (nextCancelAtPeriodEnd && !(await confirmWarning(R.stopConfirm))) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelAtPeriodEnd: nextCancelAtPeriodEnd }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        cancelAtPeriodEnd?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? R.networkError);
        return;
      }
      setCancelAtPeriodEnd(Boolean(data.cancelAtPeriodEnd));
      setMessage(R.saved);
      router.refresh();
    } catch {
      setError(R.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={
        cancelAtPeriodEnd
          ? "rounded-card border border-amber-200 bg-amber-50/80 p-5 sm:p-6"
          : "rounded-card border border-slate-200 bg-white p-5 sm:p-6"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{R.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        {cancelAtPeriodEnd && periodEndLabel
          ? R.autoOff(periodEndLabel)
          : R.autoOn}
      </p>
      {cancelAtPeriodEnd ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-900/80">{R.manualRenewHint}</p>
      ) : null}

      {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4">
        {cancelAtPeriodEnd ? (
          <button
            type="button"
            className={buttonClass("primary", "sm")}
            disabled={loading}
            onClick={() => updateRenewal(false)}
          >
            {loading ? R.loading : R.resumeButton}
          </button>
        ) : (
          <button
            type="button"
            className={buttonClass("secondary", "sm")}
            disabled={loading}
            onClick={() => updateRenewal(true)}
          >
            {loading ? R.loading : R.stopButton}
          </button>
        )}
      </div>
    </div>
  );
}
