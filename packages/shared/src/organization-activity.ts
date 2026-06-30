export const ORGANIZATION_ACTIVITIES = [
  "RESTAURANT",
  "HOTEL",
  "CAFE_BAR",
  "BEACH_BAR",
  "OTHER",
] as const;

export type OrganizationActivity = (typeof ORGANIZATION_ACTIVITIES)[number];

export const ORGANIZATION_ACTIVITY_LABELS: Record<OrganizationActivity, string> = {
  RESTAURANT: "Εστιατόριο",
  HOTEL: "Ξενοδοχείο",
  CAFE_BAR: "Καφέ / Bar",
  BEACH_BAR: "Beach bar",
  OTHER: "Άλλο",
};
