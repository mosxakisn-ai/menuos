export const ONBOARDING_QR_COOKIE = "menuos-onboarding-qr";
export const ONBOARDING_CONFIRMED_COOKIE = "menuos-onboarding-confirmed";

export const ONBOARDING_STEP_COUNT = 4;

/** Show the onboarding modal only on overview — never over forms. */
export function shouldShowOnboardingPopup(pathname: string): boolean {
  return pathname === "/dashboard";
}
