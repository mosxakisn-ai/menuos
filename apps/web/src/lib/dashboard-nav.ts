import { LIVE360_UPGRADE_QUERY } from "@/lib/billing";

export const LIVE360_NAV_HREFS = ["/dashboard/waiter", "/dashboard/history"] as const;

export function isLive360NavLocked(href: string, live360Enabled: boolean): boolean {
  return (LIVE360_NAV_HREFS as readonly string[]).includes(href) && !live360Enabled;
}

/** STAFF cannot open billing — keep them on the locked page instead. */
export function live360LockedNavHref(href: string, userRole: string): string {
  if (userRole === "STAFF") return href;
  return live360NavUpgradeHref();
}

export function live360NavUpgradeHref(): string {
  return `/dashboard/billing?upgrade=${LIVE360_UPGRADE_QUERY}`;
}
