/** Client-safe Live 360° plan helpers — no server/DB/mail imports. */

export const LIVE360_UPGRADE_QUERY = "live-360";

export function organizationCanUseLive360(planId: string): boolean {
  return planId === "PRO" || planId === "ENTERPRISE";
}
