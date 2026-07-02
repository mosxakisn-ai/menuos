/** Only allow in-app dashboard return paths after login. */
export function safeDashboardCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/dashboard") || raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  return raw;
}

export function loginUrlWithCallback(returnTo: string): string {
  const safe = safeDashboardCallbackUrl(returnTo);
  if (!safe) return "/login";
  return `/login?callbackUrl=${encodeURIComponent(safe)}`;
}
