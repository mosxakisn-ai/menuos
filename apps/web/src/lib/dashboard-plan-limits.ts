import type { DashboardCopy } from "@/content/dashboard-i18n";

export type DashboardPlanLimitsSnapshot = {
  planId: string;
  planName: string;
  maxVenues: number;
  maxMenusPerVenue: number | null;
  maxItems: number | null;
  venueCount: number;
  itemCount: number;
};

export function isAtCatalogLimit(snapshot: DashboardPlanLimitsSnapshot, menuCount: number): boolean {
  return snapshot.maxMenusPerVenue !== null && menuCount >= snapshot.maxMenusPerVenue;
}

export function isAtVenueLimit(snapshot: DashboardPlanLimitsSnapshot): boolean {
  return snapshot.venueCount >= snapshot.maxVenues;
}

export function isAtItemLimit(snapshot: DashboardPlanLimitsSnapshot): boolean {
  return snapshot.maxItems !== null && snapshot.itemCount >= snapshot.maxItems;
}

export function itemsRemaining(snapshot: DashboardPlanLimitsSnapshot): number | null {
  if (snapshot.maxItems === null) return null;
  return Math.max(0, snapshot.maxItems - snapshot.itemCount);
}

export function catalogLimitMessage(d: DashboardCopy, snapshot: DashboardPlanLimitsSnapshot): string {
  const max = snapshot.maxMenusPerVenue;
  if (max === null) return d.flash.codes.menu_limit ?? d.flash.genericError;
  if (snapshot.planId === "TRIAL") return d.planLimits.catalogTrial;
  if (snapshot.planId === "BASIC") return d.planLimits.catalogBasic(max);
  return d.planLimits.catalogGeneric(snapshot.planName, max);
}

export function itemLimitMessage(d: DashboardCopy, snapshot: DashboardPlanLimitsSnapshot): string {
  if (snapshot.planId === "TRIAL") return d.planLimits.itemsTrial;
  const max = snapshot.maxItems;
  if (max === null) return d.flash.codes.item_limit ?? d.flash.genericError;
  return d.planLimits.itemsAtLimit(max);
}

export function itemNearLimitMessage(d: DashboardCopy, snapshot: DashboardPlanLimitsSnapshot): string | null {
  const max = snapshot.maxItems;
  if (max === null) return null;
  const remaining = itemsRemaining(snapshot);
  if (remaining === null || remaining > 5 || remaining === 0) return null;
  if (snapshot.planId === "TRIAL") return d.planLimits.itemsNearTrial(snapshot.itemCount, max);
  return d.planLimits.itemsNearGeneric(snapshot.itemCount, max);
}

export function venueLimitMessage(d: DashboardCopy, snapshot: DashboardPlanLimitsSnapshot): string {
  if (snapshot.planId === "TRIAL") return d.planLimits.venueTrial;
  return d.planLimits.venueAtLimit(snapshot.maxVenues);
}
