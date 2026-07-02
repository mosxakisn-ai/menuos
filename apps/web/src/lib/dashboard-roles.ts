import type { UserRole } from "@menuos/db";

export const VENUE_MANAGER_ROLES: UserRole[] = ["ADMIN", "MANAGER"];

export function canManageVenueSecrets(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

const ALL_DASHBOARD_NAV_HREFS = [
  "/dashboard",
  "/dashboard/menus",
  "/dashboard/qr",
  "/dashboard/waiter",
  "/dashboard/history",
  "/dashboard/billing",
  "/dashboard/settings",
] as const;

const STAFF_DASHBOARD_NAV_HREFS = ["/dashboard/waiter", "/dashboard/settings"] as const;

export function dashboardNavHrefsForRole(role: UserRole | string): readonly string[] {
  if (role === "STAFF") return STAFF_DASHBOARD_NAV_HREFS;
  return ALL_DASHBOARD_NAV_HREFS;
}
