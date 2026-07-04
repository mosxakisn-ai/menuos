import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ONBOARDING_CONFIRMED_COOKIE, ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";
import {
  isOnboardingSetupComplete,
  MANDATORY_ONBOARDING_FROM,
  type OnboardingStatus,
} from "@/lib/onboarding-status";

const clearOnboardingCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 0,
};

export type ResolvedOnboardingCookies = {
  qrVisited: boolean;
  confirmed: boolean;
};

/** Read onboarding cookies and drop stale flags (e.g. after reset or abandoned flow). */
export function resolveOnboardingCookies(
  cookieStore: ReadonlyRequestCookies | ResponseCookies,
  status: OnboardingStatus,
): ResolvedOnboardingCookies {
  let qrVisited = cookieStore.get(ONBOARDING_QR_COOKIE)?.value === "1";
  let confirmed = cookieStore.get(ONBOARDING_CONFIRMED_COOKIE)?.value === "1";

  const setupComplete = isOnboardingSetupComplete(status, qrVisited);
  const grandfathered = Boolean(
    status.firstVenueCreatedAt && status.firstVenueCreatedAt < MANDATORY_ONBOARDING_FROM,
  );

  if (!grandfathered && (confirmed || qrVisited) && !setupComplete) {
    cookieStore.set(ONBOARDING_CONFIRMED_COOKIE, "", clearOnboardingCookie);
    cookieStore.set(ONBOARDING_QR_COOKIE, "", clearOnboardingCookie);
    confirmed = false;
    qrVisited = false;
  }

  return { qrVisited, confirmed };
}
