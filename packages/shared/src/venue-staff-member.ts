import { z } from "zod";
import { PASS_STATION_INPUTS, passStationInputToDb, type PassStationInput } from "./pass-signal";
import {
  DEFAULT_STATION_LABELS_EL,
  DEFAULT_STATION_LABELS_EN,
  postLabelLooksLikeFloorWaiter,
  type VenuePost,
} from "./venue-operations-config";

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

const staffMemberRoleSchema = z.string().trim().min(1).max(40);

export const staffMessageScopeSchema = staffAssignmentSchema;

export const venueStaffMemberCreateSchema = z.object({
  name: staffMemberNameSchema,
  roleLabel: staffMemberRoleSchema,
  zoneId: z
    .string()
    .trim()
    .max(60)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  stations: z.array(staffAssignmentSchema).min(1).max(1),
  messageScope: z
    .union([staffMessageScopeSchema, z.literal(""), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null)),
});

export const venueStaffMemberUpdateSchema = venueStaffMemberCreateSchema;

export const STAFF_STATION_LABELS_EL: Record<StaffStationOption, string> = {
  services: "Σερβιτόρος",
  kitchen: "Κουζίνα",
  bar: "Μπαρ",
  cold: "Κρύα",
  dessert: "Γλυκά",
  all: "Όλα",
};

export const STAFF_STATION_LABELS_EN: Record<StaffStationOption, string> = {
  services: "Waiter",
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
  if (post) {
    if (!post.enabled || post.station === "services") return null;
    return post.station;
  }
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) {
    return assignment as PassStationInput;
  }
  return null;
}

export function staffPrimaryAssignment(stations: string[]): string {
  const normalized = normalizeLegacyStaffStations(stations);
  if (normalized.length === 0) return "";
  if (normalized.includes("services")) return "services";
  return normalized[0] ?? "";
}

/** Legacy «all» → services (floor staff with guest calls). */
export function normalizeLegacyStaffStations(stations: string[]): string[] {
  if (stations.length === 1 && stations[0] === "all") return ["services"];
  return stations.filter((s) => s !== "all");
}

export function staffAssignmentsFromPrimary(assignment: string): string[] {
  return [assignment];
}

export function staffAssignmentLabelForLang(
  assignment: string,
  lang: "GR" | "EN" = "GR",
  posts?: VenuePost[],
): string {
  if (assignment === "services") {
    return staffPostPickerLabel("services", lang, posts);
  }
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

/** Dropdown label in Settings → Staff — distinguishes phone waiter vs tablet posts. */
export function staffPostPickerLabel(
  assignment: string,
  lang: "GR" | "EN" = "GR",
  posts?: VenuePost[],
): string {
  if (assignment === "services") {
    return lang === "EN" ? "Waiter — phone (floor)" : "Σερβιτόρος — δάπεδο (κινητό)";
  }
  if (assignment === "all") {
    return staffStationLabelForLang("all", lang);
  }
  const post = posts?.find((row) => row.id === assignment);
  if (post) {
    return post.label.trim();
  }
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) {
    return staffStationLabelForLang(assignment as StaffStationOption, lang);
  }
  return assignment;
}

export function staffPostStationSubtitle(
  assignment: string,
  lang: "GR" | "EN" = "GR",
  posts?: VenuePost[],
): string | null {
  if (assignment === "services" || assignment === "all") return null;
  const post = posts?.find((row) => row.id === assignment);
  if (!post) return null;
  if (post.station === "services") {
    return lang === "EN" ? "Waiter · phone" : "Σερβιτόρος · κινητό";
  }
  const stationLabels = lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
  return lang === "EN"
    ? `${stationLabels[post.station]} · pass tablet`
    : `${stationLabels[post.station]} · tablet πάσου`;
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
  const enabledIds = enabledVenuePostIds(posts);
  return assignments.every(
    (assignment) => isStaffSpecialOption(assignment) || enabledIds.has(assignment),
  );
}

/** Services or an enabled post id — not «all». */
export function validateStaffMessageScope(scope: string, posts: VenuePost[]): boolean {
  if (scope === "services") return true;
  if (scope === "all") return false;
  return enabledVenuePostIds(posts).has(scope);
}

/** Persisted scope or legacy fallback from post assignment. Invalid scopes fall back. */
export function resolveStaffMessageScope(
  member: {
    messageScope?: string | null;
    stations: string[];
  },
  posts?: VenuePost[],
): string {
  const scope = member.messageScope?.trim();
  if (scope && scope !== "all") {
    if (!posts || validateStaffMessageScope(scope, posts)) return scope;
  }
  const primary = staffPrimaryAssignment(member.stations);
  if (posts && !validateStaffMessageScope(primary === "all" ? "services" : primary, posts)) {
    return "services";
  }
  return primary === "all" ? "services" : primary;
}

export function sanitizeStaffMessageScope(
  messageScope: string | null | undefined,
  stations: string[],
  posts: VenuePost[],
): string | null {
  const scope = messageScope?.trim();
  if (scope && validateStaffMessageScope(scope, posts)) return scope;
  const fallback = resolveStaffMessageScope({ messageScope: null, stations }, posts);
  return fallback === "services" && !scope ? null : fallback;
}

function enabledVenuePostIds(posts: VenuePost[]): Set<string> {
  return new Set(posts.filter((post) => post.enabled).map((post) => post.id));
}

/** Drop disabled or removed post ids; keep services/all and dedupe order. Empty = no access until reassigned. */
export function sanitizeStaffAssignments(
  assignments: string[],
  posts: VenuePost[],
): string[] {
  const enabledIds = enabledVenuePostIds(posts);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const assignment of assignments) {
    if (!isStaffSpecialOption(assignment) && !enabledIds.has(assignment)) continue;
    if (seen.has(assignment)) continue;
    seen.add(assignment);
    out.push(assignment);
  }
  return out;
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
  if (!mapped) return false;
  return memberStations.some((assignment) => {
    const resolved = resolveStaffAssignmentToPassInput(assignment, posts);
    return resolved === mapped;
  });
}

/** Waiter calls (table buzz) only for floor/service staff. */
export function waiterCallsVisibleToStaffMember(memberStations: string[]): boolean {
  return memberStations.includes("all") || memberStations.includes("services");
}

/** Floor waiters need one space; kitchen/bar pass posts work across all spaces. */
export function staffPostRequiresZoneAssignment(
  assignment: string,
  posts?: VenuePost[],
): boolean {
  if (assignment === "services" || assignment === "all") return true;
  const post = posts?.find((row) => row.id === assignment);
  return post?.station === "services";
}

/** Pass posts ignore zone; waiters require a zone id when set. */
export function normalizeStaffMemberZoneId(
  assignment: string,
  zoneId: string | null | undefined,
  posts?: VenuePost[],
): string | null {
  if (!staffPostRequiresZoneAssignment(assignment, posts)) return null;
  const trimmed = zoneId?.trim();
  return trimmed || null;
}

export type StationScreenLinkPick = { label: string; screenToken: string };

/** Match tablet screen to staff post (label) or fall back to first screen for the station. */
export function pickStationScreenForStaffAssignment(
  assignment: string,
  posts: VenuePost[],
  screens: ReadonlyArray<StationScreenLinkPick>,
): { station: PassStationInput; screenToken: string } | null {
  const station = resolveStaffAssignmentToPassInput(assignment, posts);
  if (!station || screens.length === 0) return null;
  const post = posts.find((row) => row.id === assignment);
  if (post) {
    const byLabel = screens.find((row) => row.label.trim() === post.label.trim());
    if (byLabel) return { station, screenToken: byLabel.screenToken };
  }
  const first = screens[0];
  return first ? { station, screenToken: first.screenToken } : null;
}

export type StaffAssignmentLinkKind = "waiter" | "pass" | "invalid";

/** What link type this assignment expects (waiter / tablet / invalid removed post). */
export function staffAssignmentLinkKind(
  assignment: string,
  posts: VenuePost[],
): StaffAssignmentLinkKind {
  if (assignment === "services") return "waiter";
  if (assignment === "all") return "waiter";
  const post = posts.find((row) => row.id === assignment);
  if (post) {
    if (!post.enabled) return "invalid";
    return post.station === "services" ? "waiter" : "pass";
  }
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) return "pass";
  return "invalid";
}

/** Whether this staff member should poll or receive pass signals. */
export function passSignalsVisibleToStaffMember(
  memberStations: string[],
  posts?: VenuePost[],
): boolean {
  const allowed = passDbStationsForStaffMember(memberStations, posts);
  return allowed === null || allowed.length > 0;
}
