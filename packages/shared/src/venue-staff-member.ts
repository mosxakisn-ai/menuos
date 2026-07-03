import { z } from "zod";
import { PASS_STATION_INPUTS, passStationInputToDb, type PassStationInput } from "./pass-signal";
import type { VenuePost } from "./venue-operations-config";

export const STAFF_SPECIAL_OPTIONS = ["services", "all"] as const;
export type StaffSpecialOption = (typeof STAFF_SPECIAL_OPTIONS)[number];

/** @deprecated Legacy fixed slots — staff assignments now use post ids from operations config. */
export const STAFF_STATION_OPTIONS = [
  "services",
  "kitchen",
  "bar",
  "cold",
  "dessert",
  "all",
] as const;
export type StaffStationOption = (typeof STAFF_STATION_OPTIONS)[number];

export const staffStationOptionSchema = z.enum(STAFF_STATION_OPTIONS);
const staffAssignmentSchema = z.string().trim().min(1).max(40);

const staffMemberNameSchema = z.string().trim().min(1).max(60);

export const STAFF_ROLE_LABELS_EL = [
  "Σερβιτόρος",
  "Μάγειρας Α",
  "Μάγειρας Β",
  "Σερβιτόρος Β",
  "Ταμπλίστας",
  "Καθαριότητα",
] as const;

export const STAFF_ROLE_LABELS_EN = [
  "Waiter",
  "Cook A",
  "Cook B",
  "Waiter B",
  "Busser",
  "Cleaning",
] as const;

const ALL_STAFF_ROLE_LABELS = new Set<string>([
  ...STAFF_ROLE_LABELS_EL,
  ...STAFF_ROLE_LABELS_EN,
]);

/** Predefined roles from older seeds — still accepted on save. */
export const LEGACY_STAFF_ROLE_LABELS = [
  "Μάγειρας",
  "Μπαρ",
  "Manager",
  "Σερβιτόρος παραλίας",
  "Μπαρ παραλίας",
  "Κρύα κουζίνα",
  "Kitchen",
  "Bar",
] as const;

export function staffRoleOptionsForLang(lang: "GR" | "EN" = "GR"): readonly string[] {
  return lang === "EN" ? STAFF_ROLE_LABELS_EN : STAFF_ROLE_LABELS_EL;
}

export function isAllowedStaffRole(roleLabel: string): boolean {
  const trimmed = roleLabel.trim();
  return ALL_STAFF_ROLE_LABELS.has(trimmed) || LEGACY_STAFF_ROLE_LABELS.includes(trimmed as (typeof LEGACY_STAFF_ROLE_LABELS)[number]);
}

export function staffRoleOptionsWithLegacy(
  lang: "GR" | "EN",
  current?: string,
): string[] {
  const options = [...staffRoleOptionsForLang(lang)];
  const trimmed = current?.trim();
  if (trimmed && !options.includes(trimmed)) return [trimmed, ...options];
  return options;
}

const staffMemberRoleSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .refine(isAllowedStaffRole, { message: "Invalid staff role" });

export const venueStaffMemberCreateSchema = z.object({
  name: staffMemberNameSchema,
  roleLabel: staffMemberRoleSchema,
  stations: z.array(staffAssignmentSchema).min(1).max(12),
});

export const venueStaffMemberUpdateSchema = venueStaffMemberCreateSchema;

export const STAFF_STATION_LABELS_EL: Record<StaffStationOption, string> = {
  services: "Services",
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

export function isStaffSpecialOption(value: string): value is StaffSpecialOption {
  return value === "services" || value === "all";
}

export function resolveStaffAssignmentToPassInput(
  assignment: string,
  posts?: VenuePost[],
): PassStationInput | null {
  if (isStaffSpecialOption(assignment)) return null;
  const post = posts?.find((row) => row.id === assignment);
  if (post) return post.enabled ? post.station : null;
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) {
    return assignment as PassStationInput;
  }
  return null;
}

export function staffAssignmentLabelForLang(
  assignment: string,
  lang: "GR" | "EN" = "GR",
  posts?: VenuePost[],
): string {
  if (isStaffSpecialOption(assignment)) {
    return staffStationLabelForLang(assignment, lang);
  }
  const post = posts?.find((row) => row.id === assignment);
  if (post) return post.label.trim();
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) {
    return staffStationLabelForLang(assignment as StaffStationOption, lang);
  }
  return assignment;
}

export function formatStaffStationsForLang(stations: string[], lang: "GR" | "EN" = "GR"): string {
  return stations
    .map((s) => staffStationLabelForLang(s as StaffStationOption, lang))
    .join(", ");
}

export function formatStaffAssignmentsForLang(
  assignments: string[],
  lang: "GR" | "EN" = "GR",
  posts?: VenuePost[],
): string {
  return assignments
    .map((assignment) => staffAssignmentLabelForLang(assignment, lang, posts))
    .join(", ");
}

export function validateStaffAssignments(
  assignments: string[],
  posts: VenuePost[],
): boolean {
  if (assignments.length === 0) return false;
  const enabledIds = new Set(posts.filter((post) => post.enabled).map((post) => post.id));
  return assignments.every(
    (assignment) => isStaffSpecialOption(assignment) || enabledIds.has(assignment),
  );
}

const PASS_DB_STATION_TO_STAFF: Record<string, StaffStationOption> = {
  KITCHEN: "kitchen",
  BAR: "bar",
  COLD: "cold",
  DESSERT: "dessert",
};

/** PassStation DB values this member may see; null = all stations. */
export function passDbStationsForStaffMember(
  memberStations: string[],
  posts?: VenuePost[],
): string[] | null {
  if (memberStations.includes("all") || memberStations.includes("services")) return null;
  const stations = memberStations
    .map((assignment) => resolveStaffAssignmentToPassInput(assignment, posts))
    .filter((station): station is PassStationInput => Boolean(station))
    .map((station) => passStationInputToDb(station));
  return stations.length > 0 ? [...new Set(stations)] : [];
}

/** Whether a pass signal station is visible to this staff member's post assignments. */
export function passSignalVisibleToStaffMember(
  passDbStation: string,
  memberStations: string[],
  posts?: VenuePost[],
): boolean {
  if (memberStations.includes("all") || memberStations.includes("services")) return true;
  const mapped = PASS_DB_STATION_TO_STAFF[passDbStation];
  if (!mapped) return true;
  return memberStations.some((assignment) => {
    const resolved = resolveStaffAssignmentToPassInput(assignment, posts);
    return resolved === mapped;
  });
}

/** Waiter calls (table buzz) only for floor/service staff. */
export function waiterCallsVisibleToStaffMember(memberStations: string[]): boolean {
  return memberStations.includes("all") || memberStations.includes("services");
}
