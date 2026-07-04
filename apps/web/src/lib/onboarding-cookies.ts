import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ONBOARDING_CONFIRMED_COOKIE, ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";
import {
  isOnboardingSetupComplete,
  MANDATORY_ONBOARDING_FROM,
  type OnboardingStatus,
} from "@/lib/onboarding-status";

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
  let qrVisited = cookieStore.get(ONBOARDING_QR_COOKIE)?.value === "1";
  let confirmed = cookieStore.get(ONBOARDING_CONFIRMED_COOKIE)?.value === "1";

  const setupComplete = isOnboardingSetupComplete(status, qrVisited);
  const grandfathered = Boolean(
    status.firstVenueCreatedAt && status.firstVenueCreatedAt < MANDATORY_ONBOARDING_FROM,
  );

  if (!grandfathered && (confirmed || qrVisited) && !setupComplete) {
    confirmed = false;
    qrVisited = false;
  }

  return { qrVisited, confirmed };
}
