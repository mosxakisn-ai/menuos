import { isPaidPlan, type PaidSubscriptionPlanId } from "@menuos/shared";

export type RegisterPlanIntent = {
  checkoutPlanId: PaidSubscriptionPlanId | null;
  isTrial: boolean;
};

/** Plan from /register?plan=basic|pro|trial */
export function parseRegisterPlanIntent(raw: string | null | undefined): RegisterPlanIntent {
  const normalized = raw?.trim().toUpperCase();
  if (!normalized || normalized === "TRIAL") {
    return { checkoutPlanId: null, isTrial: true };
  }
  if (isPaidPlan(normalized)) {
    return { checkoutPlanId: normalized, isTrial: false };
  }
  return { checkoutPlanId: null, isTrial: true };
}

export function registerSubtitle(
  intent: RegisterPlanIntent,
  trialDaysGen: string,
): string {
  if (intent.checkoutPlanId === "BASIC") {
    return "Δημιούργησε λογαριασμό και συνέχισε στην ασφαλή πληρωμή Basic (Stripe). Χρειάζεται κάρτα.";
  }
  if (intent.checkoutPlanId === "PRO") {
    return "Δημιούργησε λογαριασμό και συνέχισε στην ασφαλή πληρωμή Pro (Stripe). Χρειάζεται κάρτα.";
  }
  return `Δωρεάν δοκιμή ${trialDaysGen} — χωρίς κάρτα. Θα σου στείλουμε κωδικό επιβεβαίωσης στο email (ισχύει 30 λεπτά).`;
}

export function registerSubmitLabel(intent: RegisterPlanIntent): string {
  if (intent.checkoutPlanId) return "Συνέχεια στην πληρωμή";
  return "Δημιουργία λογαριασμού";
}
