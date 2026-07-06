import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ONBOARDING_CONFIRMED_COOKIE, ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";
import { resolveOnboardingCookieFlags } from "@/lib/onboarding-logic";
import type { OnboardingStatus } from "@/lib/onboarding-status";

export type ResolvedOnboardingCookies = {
  qrVisited: boolean;
  confirmed: boolean;
};

/**
 * Read onboarding cookies. Stale flags (e.g. after reset) are ignored here.
 * Cookie deletion only happens in Route Handlers (/api/onboarding/*).
 */
export function resolveOnboardingCookies(
  cookieStore: ReadonlyRequestCookies,
  status: OnboardingStatus,
): ResolvedOnboardingCookies {
  const qrVisitedRaw =
    cookieStore.get(ONBOARDING_QR_COOKIE)?.value === "1" || status.onboardingQrAcknowledgedAt != null;
  const confirmedRaw =
    cookieStore.get(ONBOARDING_CONFIRMED_COOKIE)?.value === "1" || status.onboardingConfirmedAt != null;
  return resolveOnboardingCookieFlags(status, qrVisitedRaw, confirmedRaw);
}
