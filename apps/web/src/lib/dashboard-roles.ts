import type { UserRole } from "@menuos/db";

export const VENUE_MANAGER_ROLES: UserRole[] = ["ADMIN", "MANAGER"];

export function canManageVenueSecrets(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
