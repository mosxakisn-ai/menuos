const DEFAULT_BILLING_RETURN = "/dashboard/billing";

/** Safe in-app path for post-checkout redirects (blocks protocol-relative URLs). */
export function safeReturnPath(input: unknown, fallback = DEFAULT_BILLING_RETURN): string {
  if (typeof input !== "string") return fallback;
  const path = input.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("://")) return fallback;
  return path;
}
