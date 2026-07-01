import { isPaidPlan, type PaidSubscriptionPlanId } from "@menuos/shared";
import type { MenuOsMessages } from "@/i18n/get-messages";
import { formatMessage } from "@/lib/format-message";

export type RegisterPlanIntent = {
  checkoutPlanId: PaidSubscriptionPlanId | null;
  isTrial: boolean;
};

type RegisterAuth = MenuOsMessages["pages"]["auth"]["register"];

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
  auth: RegisterAuth,
): string {
  if (intent.checkoutPlanId === "BASIC") return auth.subtitleBasic;
  if (intent.checkoutPlanId === "PRO") return auth.subtitlePro;
  return formatMessage(auth.subtitleTrial, { days: trialDaysGen });
}

export function registerSubmitLabel(intent: RegisterPlanIntent, auth: RegisterAuth): string {
  if (intent.checkoutPlanId) return auth.submitCheckout;
  return auth.submitCreate;
}
