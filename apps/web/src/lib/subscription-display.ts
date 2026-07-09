import {
  organizationHasPaidPlan,
  computeTrialGraceEndsAt,
  getTrialAccessPhase,
} from "@menuos/shared";
import {
  formatDashboardDate,
  getDashboardCopy,
  planLabelForLang,
  type DashboardLang,
} from "@/content/dashboard-i18n";

export type SubscriptionDisplayInput = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd?: boolean;
};

export type SubscriptionDisplaySummary = {
  active: boolean;
  statusLine: string;
  expiryLine: string | null;
};

function formatDate(date: Date, lang: DashboardLang = "GR"): string {
  return formatDashboardDate(lang, date);
}

export function formatSubscriptionSummary(
  sub: SubscriptionDisplayInput | null,
  lang: DashboardLang = "GR",
): SubscriptionDisplaySummary {
  const copy = getDashboardCopy(lang);
  const statusCopy = copy.subscriptionStatus;
  const plan = sub?.plan ?? "TRIAL";
  const status = sub?.status ?? "TRIALING";
  const trialEndsAt = sub?.trialEndsAt ?? null;
  const currentPeriodEnd = sub?.currentPeriodEnd ?? null;
  const cancelAtPeriodEnd = sub?.cancelAtPeriodEnd ?? false;

  const active = organizationHasPaidPlan({
    plan,
    status,
    trialEndsAt,
  });

  if (plan === "TRIAL" && trialEndsAt) {
    const phase = getTrialAccessPhase(trialEndsAt);
    if (phase === "grace") {
      const graceEndsAt = computeTrialGraceEndsAt(trialEndsAt);
      return {
        active: true,
        statusLine: `${planLabelForLang(lang, plan)} · ${statusCopy.trialGrace}`,
        expiryLine: statusCopy.graceUntil(formatDate(graceEndsAt, lang)),
      };
    }
    const statusText = active ? statusCopy.trialActive : statusCopy.trialExpired;
    return {
      active,
      statusLine: `${planLabelForLang(lang, plan)} · ${statusText}`,
      expiryLine: trialEndsAt ? statusCopy.expiresOn(formatDate(trialEndsAt, lang)) : null,
    };
  }

  if (plan === "TRIAL") {
    const statusText = active ? statusCopy.trialActive : statusCopy.trialExpired;
    return {
      active,
      statusLine: `${planLabelForLang(lang, plan)} · ${statusText}`,
      expiryLine: null,
    };
  }

  const statusText = statusCopy[status as keyof typeof statusCopy] ?? status;
  const statusLabel = typeof statusText === "string" ? statusText : status;
  return {
    active,
    statusLine: `${planLabelForLang(lang, plan)} · ${statusLabel}`,
    expiryLine: currentPeriodEnd
      ? active
        ? cancelAtPeriodEnd
          ? statusCopy.endsOnNoRenewal(formatDate(currentPeriodEnd, lang))
          : statusCopy.renewsOn(formatDate(currentPeriodEnd, lang))
        : statusCopy.expiredOn(formatDate(currentPeriodEnd, lang))
      : null,
  };
}
