import { z } from "zod";
import { PASS_STATION_INPUTS, passStationInputToDb, type PassStationInput } from "./pass-signal";
import {
  DEFAULT_VENUE_POST_STATION_LABELS_EL,
  DEFAULT_VENUE_POST_STATION_LABELS_EN,
  isVenueKdsPostStation,
  isVenuePassPostStation,
  isVenueSupportPostStation,
  postLabelLooksLikeFloorWaiter,
  type VenuePost,
} from "./venue-operations-config";

export const STAFF_SPECIAL_OPTIONS = ["services", "all", "pass-all"] as const;
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
  return value === "services" || value === "all" || value === "pass-all";
}

export function resolveStaffAssignmentToPassInput(
  assignment: string,
  posts?: VenuePost[],
): PassStationInput | null {
  if (assignment === "pass-all") return "kitchen";
  if (isStaffSpecialOption(assignment)) return null;
  const post = posts?.find((row) => row.id === assignment);
  if (post) {
    if (!post.enabled || post.station === "services") return null;
    if (isVenuePassPostStation(post.station)) return post.station;
    if (isVenueSupportPostStation(post.station)) return "kitchen";
    return null;
  }
  if (PASS_STATION_INPUTS.includes(assignment as PassStationInput)) {
    return assignment as PassStationInput;
  }
  return null;
}

export function staffPrimaryAssignment(stations: string[]): string {
  const normalized = normalizeLegacyStaffStations(stations);
  if (normalized.length === 0) return "";
  if (normalized.includes("all")) return "all";
  if (normalized.includes("pass-all")) return "pass-all";
  if (normalized.includes("services")) return "services";
  return normalized[0] ?? "";
}

/** Drop empty station ids; keep «all» and other assignments as stored. */
export function normalizeLegacyStaffStations(stations: string[]): string[] {
  return stations.filter((s) => s.length > 0);
}

/** Map legacy «services» token to the first waiter post from Settings → Posts. */
export function migrateStaffAssignmentFromLegacy(
  assignment: string,
  posts: VenuePost[],
): string {
  if (assignment !== "services") return assignment;
  const waiterPost = posts.find((post) => post.enabled && post.station === "services");
  return waiterPost?.id ?? assignment;
}

export function migrateStaffStationsFromLegacy(
  stations: string[],
  posts: VenuePost[],
): string[] {
  return normalizeLegacyStaffStations(stations).map((station) =>
    migrateStaffAssignmentFromLegacy(station, posts),
  );
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
  if (assignment === "all") {
    return staffPostPickerLabel("all", lang, posts);
  }
  if (assignment === "pass-all") {
    return staffPostPickerLabel("pass-all", lang, posts);
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
    const migrated = migrateStaffAssignmentFromLegacy("services", posts ?? []);
    if (migrated !== "services") {
      return posts?.find((row) => row.id === migrated)?.label.trim() ?? migrated;
    }
    return lang === "EN" ? "Waiter (add in Posts tab)" : "Σερβιτόρος (πρόσθεσε στο tab Πόστα)";
  }
  if (assignment === "all") {
    return lang === "EN" ? "All — everywhere" : "Όλα — παντού";
  }
  if (assignment === "pass-all") {
    return lang === "EN" ? "All posts — tablet" : "Όλα τα πόστα — tablet";
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
  if (assignment === "services") return null;
  if (assignment === "all") {
    return lang === "EN" ? "All posts & spaces · phone" : "Όλα τα πόστα & χώροι · κινητό";
  }
  if (assignment === "pass-all") {
    return lang === "EN" ? "All kitchen/bar posts · one tablet" : "Όλα τα πόστα κουζίνας/μπαρ · ένα tablet";
  }
  const post = posts?.find((row) => row.id === assignment);
  if (!post) return null;
  if (post.station === "services") {
    return lang === "EN" ? "Waiter · phone" : "Σερβιτόρος · κινητό";
  }
  const typeLabels =
    lang === "EN" ? DEFAULT_VENUE_POST_STATION_LABELS_EN : DEFAULT_VENUE_POST_STATION_LABELS_EL;
  if (isVenueSupportPostStation(post.station)) {
    return lang === "EN"
      ? `${typeLabels[post.station]} · messages tablet`
      : `${typeLabels[post.station]} · tablet μηνυμάτων`;
  }
  if (isVenuePassPostStation(post.station)) {
    return lang === "EN"
      ? `${typeLabels[post.station]} · pass tablet`
      : `${typeLabels[post.station]} · tablet πάσου`;
  }
  return null;
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
  if (memberStations.includes("all") || memberStations.includes("pass-all") || memberStations.includes("services")) return null;
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
  if (memberStations.includes("all") || memberStations.includes("pass-all") || memberStations.includes("services")) return true;
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
  if (trimmed === "all") return "all";
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
  if (assignment === "pass-all") {
    const first = screens[0];
    return first ? { station, screenToken: first.screenToken } : null;
  }
  const post = posts.find((row) => row.id === assignment);
  if (post) {
    const byLabel = screens.find((row) => row.label.trim() === post.label.trim());
    if (byLabel) return { station, screenToken: byLabel.screenToken };
  }
  const first = screens[0];
  return first ? { station, screenToken: first.screenToken } : null;
}

export type StaffAssignmentLinkKind = "waiter" | "pass" | "support" | "invalid";

export type StaffScreenDevice = "mobile" | "kds";

/** Staff form role — drives post picker and screen (Option A). */
export const STAFF_JOB_ROLES = ["waiter", "pass"] as const;
export type StaffJobRole = (typeof STAFF_JOB_ROLES)[number];

export function staffJobRoleLabel(role: StaffJobRole, lang: "GR" | "EN" = "GR"): string {
  if (role === "waiter") return lang === "EN" ? "Waiter" : "Σερβιτόρος";
  return lang === "EN" ? "Kitchen / Bar" : "Κουζίνα / Μπαρ";
}

export function staffJobRoleForLinkKind(kind: StaffAssignmentLinkKind): StaffJobRole | null {
  if (kind === "waiter") return "waiter";
  if (kind === "pass" || kind === "support") return "pass";
  return null;
}

export function staffJobRoleForAssignment(
  assignment: string,
  posts: VenuePost[],
): StaffJobRole | "invalid" {
  const kind = staffAssignmentLinkKind(assignment, posts);
  return staffJobRoleForLinkKind(kind) ?? "invalid";
}

export function staffScreenDeviceForJobRole(role: StaffJobRole): StaffScreenDevice {
  return role === "waiter" ? "mobile" : "kds";
}

export function staffPostOptionsForJobRole(
  role: StaffJobRole,
  posts: VenuePost[],
  lang: "GR" | "EN" = "GR",
): Array<{ id: string; label: string }> {
  if (role === "waiter") {
    const waiterPosts = posts.filter((post) => post.enabled && post.station === "services");
    return [
      { id: "all", label: staffPostPickerLabel("all", lang, posts) },
      ...waiterPosts.map((post) => ({
        id: post.id,
        label: post.label.trim(),
      })),
    ];
  }
  const passPosts = posts.filter((post) => post.enabled && isVenuePassPostStation(post.station));
  const supportPosts = posts.filter(
    (post) => post.enabled && isVenueSupportPostStation(post.station),
  );
  const kdsPosts = posts.filter((post) => post.enabled && isVenueKdsPostStation(post.station));
  if (kdsPosts.length === 0) return [];
  if (passPosts.length === 0) {
    return supportPosts.map((post) => ({
      id: post.id,
      label: staffPostPickerLabel(post.id, lang, posts),
    }));
  }
  return [
    { id: "pass-all", label: staffPostPickerLabel("pass-all", lang, posts) },
    ...passPosts.map((post) => ({
      id: post.id,
      label: staffPostPickerLabel(post.id, lang, posts),
    })),
  ];
}

export function defaultStaffAssignmentForJobRole(role: StaffJobRole, posts: VenuePost[]): string {
  if (role === "waiter") {
    const waiterPosts = posts.filter((post) => post.enabled && post.station === "services");
    return waiterPosts[0]?.id ?? "all";
  }
  const passPosts = posts.filter((post) => post.enabled && isVenuePassPostStation(post.station));
  const kdsPosts = posts.filter((post) => post.enabled && isVenueKdsPostStation(post.station));
  if (kdsPosts.length === 0) return "";
  if (passPosts.length > 0) return "pass-all";
  return kdsPosts[0]!.id;
}

/** Phone waiter link vs KDS/BDS tablet — derived from post assignment. */
export function staffScreenDeviceForAssignment(
  assignment: string,
  posts: VenuePost[],
): StaffScreenDevice | "invalid" {
  const kind = staffAssignmentLinkKind(assignment, posts);
  if (kind === "waiter") return "mobile";
  if (kind === "pass" || kind === "support") return "kds";
  return "invalid";
}

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
    if (post.station === "services") return "waiter";
    if (isVenuePassPostStation(post.station)) return "pass";
    if (isVenueSupportPostStation(post.station)) return "support";
    return "invalid";
  }
  if (assignment === "pass-all") return "pass";
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
