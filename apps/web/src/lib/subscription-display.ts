import { organizationHasPaidPlan } from "@menuos/shared";
import { planLabel } from "@/content/dashboard-el";

const STATUS_GR: Record<string, string> = {
  TRIALING: "Δοκιμή",
  ACTIVE: "Ενεργή",
  PAST_DUE: "Καθυστέρηση πληρωμής",
  CANCELED: "Ακυρωμένη",
};

export type SubscriptionDisplayInput = {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

export type SubscriptionDisplaySummary = {
  active: boolean;
  statusLine: string;
  expiryLine: string | null;
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("el-GR");
}

export function formatSubscriptionSummary(sub: SubscriptionDisplayInput | null): SubscriptionDisplaySummary {
  const plan = sub?.plan ?? "TRIAL";
  const status = sub?.status ?? "TRIALING";
  const trialEndsAt = sub?.trialEndsAt ?? null;
  const currentPeriodEnd = sub?.currentPeriodEnd ?? null;

  const active = organizationHasPaidPlan({
    plan,
    status,
    trialEndsAt,
  });

  if (plan === "TRIAL") {
    const statusText = active ? "Ενεργή δοκιμή" : "Ληγμένη";
    return {
      active,
      statusLine: `${planLabel(plan)} · ${statusText}`,
      expiryLine: trialEndsAt ? `Λήγει ${formatDate(trialEndsAt)}` : null,
    };
  }

  const statusText = STATUS_GR[status] ?? status;
  return {
    active,
    statusLine: `${planLabel(plan)} · ${statusText}`,
    expiryLine: currentPeriodEnd
      ? active
        ? `Ανανέωση ${formatDate(currentPeriodEnd)}`
        : `Έληξε ${formatDate(currentPeriodEnd)}`
      : null,
  };
}
