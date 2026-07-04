export const ONBOARDING_QR_COOKIE = "menuos-onboarding-qr";
export const ONBOARDING_CONFIRMED_COOKIE = "menuos-onboarding-confirmed";

export const ONBOARDING_STEP_COUNT = 4;

/** Onboarding wizard overlay — only on overview (billing stays usable without modal). */
export function isOnboardingWizardOverlayPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}
