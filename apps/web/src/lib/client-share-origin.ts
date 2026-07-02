import { getPublicAppUrl, isUnreachableBrowserHost, resolvePublicOrigin } from "@/lib/public-app-origin";

/** Origin for copied share links — never 0.0.0.0; uses NEXT_PUBLIC_APP_URL when set. */
export function clientShareOrigin(): string {
  if (typeof window === "undefined") return "";
  const { hostname, port } = window.location;
  if (isUnreachableBrowserHost(hostname)) {
    const publicBase = getPublicAppUrl();
    try {
      const pub = new URL(publicBase);
      if (!pub.port && port) return `${pub.protocol}//${pub.hostname}:${port}`;
      return pub.origin;
    } catch {
      return resolvePublicOrigin(window.location.origin);
    }
  }
  return window.location.origin;
}