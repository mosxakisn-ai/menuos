import { z } from "zod";

export const STAFF_STATION_OPTIONS = ["services", "kitchen", "bar", "cold", "dessert", "all"] as const;
export type StaffStationOption = (typeof STAFF_STATION_OPTIONS)[number];

export const staffStationOptionSchema = z.enum(STAFF_STATION_OPTIONS);

const staffMemberNameSchema = z.string().trim().min(1).max(60);
const staffMemberRoleSchema = z.string().trim().min(1).max(40);

export const venueStaffMemberCreateSchema = z.object({
  name: staffMemberNameSchema,
  roleLabel: staffMemberRoleSchema,
  stations: z.array(staffStationOptionSchema).min(1).max(6),
});

export const venueStaffMemberUpdateSchema = venueStaffMemberCreateSchema;

export const STAFF_STATION_LABELS_EL: Record<StaffStationOption, string> = {
  services: "Σερβιτόριο",
  kitchen: "Κουζίνα",
  bar: "Μπαρ",
  cold: "Κρύα",
  dessert: "Γλυκά",
  all: "Όλα",
};

export const STAFF_STATION_LABELS_EN: Record<StaffStationOption, string> = {
  services: "Services",
  kitchen: "Kitchen",
  bar: "Bar",
  cold: "Cold",
  dessert: "Dessert",
  all: "All",
};

export function staffStationLabelForLang(
  station: StaffStationOption,
  lang: "GR" | "EN" = "GR",
): string {
  const labels = lang === "EN" ? STAFF_STATION_LABELS_EN : STAFF_STATION_LABELS_EL;
  return labels[station] ?? station;
}

export function formatStaffStationsForLang(stations: string[], lang: "GR" | "EN" = "GR"): string {
  return stations
    .map((s) => staffStationLabelForLang(s as StaffStationOption, lang))
    .join(", ");
}

const PASS_DB_STATION_TO_STAFF: Record<string, StaffStationOption> = {
  KITCHEN: "kitchen",
  BAR: "bar",
  COLD: "cold",
  DESSERT: "dessert",
};

const STAFF_TO_PASS_DB_STATION: Record<StaffStationOption, string | null> = {
  services: null,
  all: null,
  kitchen: "KITCHEN",
  bar: "BAR",
  cold: "COLD",
  dessert: "DESSERT",
};

/** PassStation DB values this member may see; null = all stations. */
export function passDbStationsForStaffMember(memberStations: string[]): string[] | null {
  if (memberStations.includes("all") || memberStations.includes("services")) return null;
  const stations = memberStations
    .map((s) => STAFF_TO_PASS_DB_STATION[s as StaffStationOption])
    .filter((s): s is string => Boolean(s));
  return stations.length > 0 ? [...new Set(stations)] : [];
}

/** Whether a pass signal station is visible to this staff member's department tags. */
export function passSignalVisibleToStaffMember(
  passDbStation: string,
  memberStations: string[],
): boolean {
  if (memberStations.includes("all") || memberStations.includes("services")) return true;
  const mapped = PASS_DB_STATION_TO_STAFF[passDbStation];
  if (!mapped) return true;
  return memberStations.includes(mapped);
}

/** Waiter calls (table buzz) only for floor/service staff. */
export function waiterCallsVisibleToStaffMember(memberStations: string[]): boolean {
  return memberStations.includes("all") || memberStations.includes("services");
}
