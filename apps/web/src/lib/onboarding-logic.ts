/** Pure onboarding flow rules — no DB imports (testable). */

/** Feature launch — venues created before this skip mandatory onboarding (grandfather). */
export const MANDATORY_ONBOARDING_FROM = new Date("2026-07-04T00:00:00.000Z");

export type OnboardingStatusSnapshot = {
  hasVenue: boolean;
  hasItem: boolean;
  firstVenueCreatedAt?: Date;
};

export function isGrandfatheredOnboarding(status: OnboardingStatusSnapshot): boolean {
  return Boolean(
    status.firstVenueCreatedAt && status.firstVenueCreatedAt < MANDATORY_ONBOARDING_FROM,
  );
}

/** Steps 1–3 complete (venue, catalog saved, QR acknowledged). */
export function isOnboardingSetupComplete(
  status: OnboardingStatusSnapshot,
  qrVisited: boolean,
): boolean {
  if (!status.hasVenue || !status.hasItem) return false;
  if (qrVisited || isGrandfatheredOnboarding(status)) return true;
  return false;
}

export function isOnboardingComplete(
  status: OnboardingStatusSnapshot,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (isGrandfatheredOnboarding(status)) return true;
  if (!confirmed) return false;
  return isOnboardingSetupComplete(status, qrVisited);
}

/** Step 4 confirmation — skip for grandfathered accounts. */
export function needsOnboardingConfirmation(
  status: OnboardingStatusSnapshot,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (confirmed) return false;
  if (isGrandfatheredOnboarding(status)) return false;
  return isOnboardingSetupComplete(status, qrVisited);
}

/** 0 = venue, 1 = catalog, 2 = QR, 3 = confirm */
export function getOnboardingCurrentStepIndex(
  status: OnboardingStatusSnapshot,
  qrVisited: boolean,
): number {
  if (isOnboardingSetupComplete(status, qrVisited)) return 3;
  if (!status.hasVenue) return 0;
  if (!status.hasItem) return 1;
  if (!qrVisited) return 2;
  return 3;
}

function isDashboardOverview(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

/** Paths allowed while onboarding is incomplete. Wizard runs on overview only. */
export function isOnboardingPathAllowed(
  pathname: string,
  status: OnboardingStatusSnapshot,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (isOnboardingComplete(status, qrVisited, confirmed)) return true;
  if (pathname.startsWith("/dashboard/billing")) return true;
  return isDashboardOverview(pathname);
}

/** Sidebar/mobile nav — overview + billing stay reachable during onboarding wizard. */
export function isOnboardingNavHrefBlocked(href: string, onboardingLocked: boolean): boolean {
  if (!onboardingLocked) return false;
  if (href === "/dashboard" || href.startsWith("/dashboard/billing")) return false;
  return true;
}

/** Ignore stale QR/confirmed cookies when setup was reset mid-flow. */
export function resolveOnboardingCookieFlags(
  status: OnboardingStatusSnapshot,
  qrVisitedRaw: boolean,
  confirmedRaw: boolean,
): { qrVisited: boolean; confirmed: boolean } {
  let qrVisited = qrVisitedRaw;
  let confirmed = confirmedRaw;

  const setupComplete = isOnboardingSetupComplete(status, qrVisited);
  const grandfathered = isGrandfatheredOnboarding(status);

  if (!grandfathered && (confirmed || qrVisited) && !setupComplete) {
    confirmed = false;
    qrVisited = false;
  }

  return { qrVisited, confirmed };
}
