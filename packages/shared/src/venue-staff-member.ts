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
