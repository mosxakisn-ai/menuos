export const ONBOARDING_QR_COOKIE = "menuos-onboarding-qr";

/** Show the onboarding modal only on overview — never over forms. */
export function shouldShowOnboardingPopup(pathname: string): boolean {
  return pathname === "/dashboard";
}
