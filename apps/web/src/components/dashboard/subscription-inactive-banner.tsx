import { DASHBOARD_EL } from "@/content/dashboard-el";

export function getInactiveSubscriptionMessage(subscription: {
  plan: string;
  status: string;
}): string {
  if (subscription.plan === "TRIAL") {
    return DASHBOARD_EL.trial.expired;
  }
  if (subscription.status === "CANCELED") {
    return DASHBOARD_EL.billing.canceledInactive;
  }
  return DASHBOARD_EL.billing.inactiveGeneric;
}

export function SubscriptionInactiveBanner({
  show,
  subscription,
}: {
  show: boolean;
  subscription: { plan: string; status: string } | null;
}) {
  if (!show || !subscription) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-950">
      <p className="font-semibold">{DASHBOARD_EL.billing.inactiveTitle}</p>
      <p className="mt-1.5">{getInactiveSubscriptionMessage(subscription)}</p>
    </div>
  );
}
