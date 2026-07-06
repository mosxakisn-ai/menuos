export const ONBOARDING_QR_COOKIE = "menuos-onboarding-qr";
export const ONBOARDING_CONFIRMED_COOKIE = "menuos-onboarding-confirmed";

export const ONBOARDING_COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

/** One year — survives browser restarts. */
export const ONBOARDING_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export const ONBOARDING_STEP_COUNT = 4;

/** Onboarding wizard overlay — only on overview (billing stays usable without modal). */
export function isOnboardingWizardOverlayPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}
