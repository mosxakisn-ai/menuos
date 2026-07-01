"use client";

import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export function SubscriptionInactiveBanner({
  show,
  subscription,
}: {
  show: boolean;
  subscription: { plan: string; status: string } | null;
}) {
  const { d } = useDashboardCopy();
  if (!show || !subscription) return null;

  const message =
    subscription.plan === "TRIAL"
      ? d.trial.expired
      : subscription.status === "CANCELED"
        ? d.billing.canceledInactive
        : d.billing.inactiveGeneric;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-950">
      <p className="font-semibold">{d.billing.inactiveTitle}</p>
      <p className="mt-1.5">{message}</p>
    </div>
  );
}
