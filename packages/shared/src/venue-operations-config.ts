import { z } from "zod";
import {
  PASS_STATION_INPUTS,
  passStationDbToInput,
  passStationInputSchema,
  type PassStationInput,
} from "./pass-signal";
import { TABLE_TILE_STATES, type TableTileState } from "./waiter-table-grid";
import type { SpotZoneGroup } from "./station-spot-zones";

export const DEFAULT_ENABLED_STATIONS: PassStationInput[] = ["kitchen", "bar"];

/** Post types in Settings → Πόστα (work roles — not legacy cold/dessert pass splits). */
export const VENUE_POST_STATION_INPUTS = [
  "kitchen",
  "bar",
  "services",
  "dishwash",
  "cleaning",
  "general",
] as const;
export type VenuePostStationInput = (typeof VENUE_POST_STATION_INPUTS)[number];
export const venuePostStationSchema = z.enum(VENUE_POST_STATION_INPUTS);

export const DEFAULT_VENUE_POST_STATION_LABELS_EL: Record<VenuePostStationInput, string> = {
  kitchen: "Κουζίνα",
  bar: "Μπαρ",
  services: "Σερβιτόρος",
  dishwash: "Λάντζα",
  cleaning: "Καθαριότητα",
  general: "Γενικά",
};

export const DEFAULT_VENUE_POST_STATION_LABELS_EN: Record<VenuePostStationInput, string> = {
  kitchen: "Kitchen",
  bar: "Bar",
  services: "Services",
  dishwash: "Dishwash",
  cleaning: "Cleaning",
  general: "General",
};

export function venuePostStationLabel(
  station: VenuePostStationInput,
  lang: "GR" | "EN" = "GR",
): string {
  return lang === "EN"
    ? DEFAULT_VENUE_POST_STATION_LABELS_EN[station]
    : DEFAULT_VENUE_POST_STATION_LABELS_EL[station];
}

export function isVenuePassPostStation(
  station: VenuePostStationInput,
): station is "kitchen" | "bar" {
  return station === "kitchen" || station === "bar";
}

/** Back-of-house roles with tablet messages (not food pass). */
export function isVenueSupportPostStation(
  station: VenuePostStationInput,
): station is "dishwash" | "cleaning" | "general" {
  return station === "dishwash" || station === "cleaning" || station === "general";
}

/** Kitchen/bar pass or support tablet posts — shown on KDS staff picker. */
export function isVenueKdsPostStation(station: VenuePostStationInput): boolean {
  return isVenuePassPostStation(station) || isVenueSupportPostStation(station);
}

function normalizeVenuePostStation(raw: string): VenuePostStationInput {
  if (raw === "cold") return "kitchen";
  if (raw === "dessert") return "bar";
  if ((VENUE_POST_STATION_INPUTS as readonly string[]).includes(raw)) {
    return raw as VenuePostStationInput;
  }
  return "kitchen";
}

function migrateVenuePostStations(posts: VenuePost[]): VenuePost[] {
  return posts.map((post) => ({
    ...post,
    station: normalizeVenuePostStation(post.station as string),
  }));
}

export const DEFAULT_PASS_QUICK_CHIPS: Record<PassStationInput, string[]> = {
  kitchen: ["Ξέχασες τον πάγο", "Ξέχασες το ψωμί", "2 πιάτα μαζί", "Επείγον"],
  bar: ["Χωρίς πάγο", "Με πάγο", "Ξέχασες καλαμάκι", "Επείγον"],
  cold: ["Με σως χωριστά", "Χωρίς κρεμμύδι", "Ξέχασες πίτα", "Επείγον"],
  dessert: ["Με παγωτό", "Χωρίς ζάχαρη", "Ξέχασες κουταλάκι", "Επείγον"],
};

export const DEFAULT_TABLE_STATE_LABELS_EL: Record<TableTileState, string> = {
  idle: "Ήσυχο",
  guest_call: "Κλήση πελάτη",
  kitchen_ready: "Έτοιμο — κουζίνα",
  cold_ready: "Έτοιμο — κρύα",
  bar_ready: "Έτοιμο — μπαρ",
  both: "Πολλαπλά",
};

export const DEFAULT_TABLE_STATE_LABELS_EN: Record<TableTileState, string> = {
  idle: "Quiet",
  guest_call: "Guest call",
  kitchen_ready: "Kitchen ready",
  cold_ready: "Cold ready",
  bar_ready: "Bar ready",
  both: "Multiple",
};

export const DEFAULT_STATION_LABELS_EL: Record<PassStationInput, string> = {
  kitchen: "Κουζίνα",
  bar: "Μπαρ",
  cold: "Κρύα",
  dessert: "Γλυκά",
};

export const DEFAULT_STATION_LABELS_EN: Record<PassStationInput, string> = {
  kitchen: "Kitchen",
  bar: "Bar",
  cold: "Cold prep",
  dessert: "Dessert",
};

const tableTileStateSchema = z.enum(
  TABLE_TILE_STATES as unknown as [TableTileState, ...TableTileState[]],
);

const quickChipSchema = z.string().trim().min(1).max(60);
const zoneLabelSchema = z.string().trim().min(1).max(40);
const stationLabelSchema = z.string().trim().min(1).max(40);

export const MAX_VENUE_POSTS = 12;

/** Default chip color per post card (Services + enabled posts). */
export const DEFAULT_POST_MESSAGE_COLORS = [
  "#475569",
  "#2563EB",
  "#EA580C",
  "#059669",
  "#7C3AED",
  "#DB2777",
  "#0891B2",
  "#CA8A04",
] as const;

export function getPostMessageColor(
  config: VenueOperationsConfig | undefined,
  postId: string,
  index = 0,
): string {
  const custom = config?.postColors?.[postId];
  if (custom) return custom;
  return DEFAULT_POST_MESSAGE_COLORS[index % DEFAULT_POST_MESSAGE_COLORS.length]!;
}

/** Reserved for staff assignment tokens — not valid custom post ids. */
export const RESERVED_VENUE_POST_IDS = ["services", "all"] as const;

export function isReservedVenuePostId(id: string): boolean {
  return id === "services" || id === "all";
}

export const venuePostSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .refine((id) => !isReservedVenuePostId(id), {
      message: "Post id is reserved",
    }),
  label: stationLabelSchema,
  enabled: z.boolean(),
  station: z
    .string()
    .transform((s) => normalizeVenuePostStation(s))
    .pipe(venuePostStationSchema),
  zoneId: z.string().trim().max(60).nullable().optional(),
});

export type VenuePost = z.infer<typeof venuePostSchema>;

export const venueOperationsConfigSchema = z.object({
  posts: z.array(venuePostSchema).min(1).max(MAX_VENUE_POSTS).optional(),
  enabledStations: z.array(passStationInputSchema).min(1).max(4),
  stationLabels: z
    .object({
      kitchen: stationLabelSchema.optional(),
      bar: stationLabelSchema.optional(),
      cold: stationLabelSchema.optional(),
      dessert: stationLabelSchema.optional(),
    })
    .partial()
    .optional(),
  quickChips: z
    .record(z.string().trim().min(1).max(40), z.array(quickChipSchema).max(12))
    .optional(),
  tableStateLabels: z.record(tableTileStateSchema, zoneLabelSchema).optional(),
  hiddenTableStates: z.array(tableTileStateSchema).max(6).optional(),
  postColors: z
    .record(z.string().trim().min(1).max(40), z.string().regex(/^#[0-9A-Fa-f]{6}$/))
    .optional(),
  zoneLabels: z.record(z.string().trim().max(60), zoneLabelSchema).optional(),
});

export type VenueOperationsConfig = z.infer<typeof venueOperationsConfigSchema>;

export const venueOperationsConfigPatchSchema = venueOperationsConfigSchema.partial();

export type VenueOperationsConfigPatch = z.infer<typeof venueOperationsConfigPatchSchema>;

function uniqueStations(stations: PassStationInput[]): PassStationInput[] {
  const seen = new Set<PassStationInput>();
  const out: PassStationInput[] = [];
  for (const s of stations) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export function defaultVenuePosts(lang: "GR" | "EN" = "GR"): VenuePost[] {
  const labels =
    lang === "EN" ? DEFAULT_VENUE_POST_STATION_LABELS_EN : DEFAULT_VENUE_POST_STATION_LABELS_EL;
  return [
    ...( ["kitchen", "bar"] as const).map((station) => ({
      id: station,
      label: labels[station],
      enabled: true,
      station,
    })),
    {
      id: "post-waiter",
      label: labels.services,
      enabled: true,
      station: "services" as const,
      zoneId: null,
    },
  ];
}

export function postsFromLegacy(
  config: Pick<VenueOperationsConfig, "enabledStations" | "stationLabels">,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  const labels =
    lang === "EN" ? DEFAULT_VENUE_POST_STATION_LABELS_EN : DEFAULT_VENUE_POST_STATION_LABELS_EL;
  const passStations: VenuePostStationInput[] = ["kitchen", "bar"];
  return passStations.map((station) => {
    const passStation = station as "kitchen" | "bar";
    return {
      id: station,
      label: config.stationLabels?.[passStation]?.trim() || labels[station],
      enabled: config.enabledStations.includes(passStation),
      station,
    };
  });
}

export function listVenuePosts(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  if (config?.posts?.length) return config.posts;
  if (!config) return defaultVenuePosts(lang);
  return postsFromLegacy(config, lang);
}

export function enabledVenuePosts(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return listVenuePosts(config, lang).filter((post) => post.enabled);
}

/** Map legacy cold/dessert screen URLs to kitchen/bar pass stations. */
export function passScreenToPostStation(station: PassStationInput): PassStationInput {
  if (station === "cold") return "kitchen";
  if (station === "dessert") return "bar";
  return station;
}

/** Whether this tablet screen station is enabled (cold → kitchen, dessert → bar). */
export function isPassScreenStationEnabled(
  config: VenueOperationsConfig | undefined,
  station: PassStationInput,
): boolean {
  if (!config) return false;
  const postStation = passScreenToPostStation(station);
  return config.enabledStations.includes(postStation as PassStationInput);
}

/** Enabled pass posts for one tablet station (kitchen, bar, …). */
export function enabledPassPostsForStation(
  config: VenueOperationsConfig | undefined,
  station: PassStationInput,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  const postStation = passScreenToPostStation(station);
  return enabledVenuePosts(config, lang).filter(
    (post) => isVenuePassPostStation(post.station) && post.station === postStation,
  );
}

/** All enabled kitchen/bar/cold/dessert posts — for one cook on one tablet. */
export function enabledPassPostsAll(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return enabledVenuePosts(config, lang).filter((post) => isVenuePassPostStation(post.station));
}

/** All enabled tablet posts (kitchen, bar, λάντζα, κ.λπ.) — shared messages on KDS. */
export function enabledKdsPostsAll(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return enabledVenuePosts(config, lang).filter((post) => isVenueKdsPostStation(post.station));
}

/** Enabled support tablet posts (λάντζα, καθαριότητα, γενικά). */
export function enabledSupportPostsAll(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return enabledVenuePosts(config, lang).filter((post) =>
    isVenueSupportPostStation(post.station),
  );
}

/** Merge quick-message labels from several posts (dedupe, keep order). */
export function mergeQuickChipLabels(...groups: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const label of group) {
      const trimmed = label.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

/** Pass post shown under a KDS zone tab (no zoneId = all spaces). */
export function venuePostMatchesZone(
  post: Pick<VenuePost, "zoneId">,
  zoneId: string | null | undefined,
): boolean {
  const assigned = post.zoneId?.trim();
  if (!assigned) return true;
  if (!zoneId?.trim()) return true;
  return assigned === zoneId.trim();
}

export function syncLegacyFromPosts(
  posts: VenuePost[],
): Pick<VenueOperationsConfig, "enabledStations" | "stationLabels"> {
  const enabled = posts.filter((post) => post.enabled);
  const enabledStations = uniqueStations(
    enabled
      .map((post) => post.station)
      .filter(isVenuePassPostStation),
  );
  const stationLabels: NonNullable<VenueOperationsConfig["stationLabels"]> = {};
  for (const post of enabled) {
    if (!isVenuePassPostStation(post.station)) continue;
    const fallback = DEFAULT_STATION_LABELS_EL[post.station];
    const trimmed = post.label.trim();
    if (trimmed && trimmed !== fallback) {
      stationLabels[post.station] = trimmed;
    }
  }
  return {
    enabledStations: enabledStations.length > 0 ? enabledStations : ["kitchen"],
    stationLabels: Object.keys(stationLabels).length > 0 ? stationLabels : undefined,
  };
}

export function newVenuePostId(): string {
  return `post-${Date.now().toString(36)}`;
}

/** Label looks like a waiter/services post name (Services, Σερβιτόρος, waiter…). */
export function postLabelLooksLikeFloorWaiter(label: string): boolean {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return /(^|[^a-z])waiter|(^|[^a-z])services|σερβιτορ|servitor/i.test(normalized);
}

/** Waiter-like name on a kitchen/bar post — invalid; use type Σερβιτόρος instead. */
export function postLabelMisplacedForStation(post: Pick<VenuePost, "label" | "station">): boolean {
  if (post.station === "services") return false;
  return postLabelLooksLikeFloorWaiter(post.label);
}

export function isJunkVenuePost(_post: VenuePost): boolean {
  return false;
}

export function isExcludedStaffVenuePost(post: Pick<VenuePost, "label" | "station">): boolean {
  return isPlaceholderVenuePostLabel(post.label);
}

/** Unsaved placeholder from «Προσθήκη πόστου» — hidden from staff picker until renamed. */
export function isPlaceholderVenuePostLabel(label: string): boolean {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return normalized === "νεο ποστο" || normalized === "new post";
}

/** Enabled posts assignable in Staff (excludes unsaved placeholder label only). */
export function staffAssignableVenuePosts(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return enabledVenuePosts(config, lang).filter(
    (post) => !isPlaceholderVenuePostLabel(post.label),
  );
}

/** Floor-waiter posts from Settings → Posts (type Σερβιτόρος / services). */
export function waiterVenuePosts(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  return staffAssignableVenuePosts(config, lang).filter((post) => post.station === "services");
}

function stripJunkVenuePosts(posts: VenuePost[]): VenuePost[] {
  return posts.filter((post) => !isJunkVenuePost(post));
}

function dedupeVenuePosts(posts: VenuePost[]): VenuePost[] {
  const seen = new Set<string>();
  const out: VenuePost[] = [];
  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    out.push(post);
  }
  return out;
}

function postsForLegacyQuickChipStation(
  posts: VenuePost[],
  stationKey: string,
): VenuePost[] {
  const enabled = posts.filter((post) => post.enabled);
  if (stationKey === "cold") {
    return enabled.filter((post) => post.station === "kitchen");
  }
  if (stationKey === "dessert") {
    return enabled.filter((post) => post.station === "bar");
  }
  return enabled.filter((post) => post.station === stationKey);
}

/** Station keys that may appear as legacy quickChips map keys (pre per-post ids). */
function legacyQuickChipStationKeys(): string[] {
  const keys = new Set<string>([...PASS_STATION_INPUTS, ...VENUE_POST_STATION_INPUTS]);
  return [...keys];
}

function migrateLegacyQuickChipsToPostIds(
  posts: VenuePost[],
  quickChips?: Record<string, string[]>,
): Record<string, string[]> | undefined {
  if (!quickChips) return undefined;
  const next = { ...quickChips };
  let changed = false;
  const postIds = new Set(posts.map((post) => post.id));

  for (const stationKey of legacyQuickChipStationKeys()) {
    const legacy = next[stationKey];
    if (!legacy) continue;

    const stationPosts = postsForLegacyQuickChipStation(posts, stationKey);
    const keyIsPostId = postIds.has(stationKey);

    if (keyIsPostId) {
      // Post id equals legacy station name (e.g. id "kitchen") — keep chips on that post only.
      continue;
    }

    for (const post of stationPosts) {
      if (next[post.id] !== undefined) continue;
      next[post.id] = [...legacy];
      changed = true;
      break;
    }
    if (stationPosts.length > 0) {
      delete next[stationKey];
      changed = true;
    }
  }
  if (Object.keys(next).length === 0) return undefined;
  return changed ? next : quickChips;
}

function finalizeVenueOperationsConfig(
  data: Omit<VenueOperationsConfig, "posts"> & { posts?: VenuePost[] },
): VenueOperationsConfig {
  let posts = dedupeVenuePosts(data.posts?.length ? data.posts : postsFromLegacy(data));
  posts = migrateVenuePostStations(posts);
  const removedIds = new Set<string>();
  if (posts.length === 0) {
    posts = defaultVenuePosts("GR");
  }
  if (!posts.some((post) => post.enabled)) {
    posts = posts.map((post, index) => ({ ...post, enabled: index === 0 }));
  }
  const legacy = syncLegacyFromPosts(posts);
  let quickChips = migrateLegacyQuickChipsToPostIds(posts, data.quickChips);
  let postColors = data.postColors;
  if (removedIds.size > 0) {
    if (quickChips) {
      quickChips = { ...quickChips };
      for (const id of removedIds) delete quickChips[id];
      if (Object.keys(quickChips).length === 0) quickChips = undefined;
    }
    if (postColors) {
      postColors = { ...postColors };
      for (const id of removedIds) delete postColors[id];
      if (Object.keys(postColors).length === 0) postColors = undefined;
    }
  }
  return {
    ...data,
    ...legacy,
    quickChips,
    postColors,
    enabledStations: uniqueStations(
      legacy.enabledStations.filter((s) => s === "kitchen" || s === "bar"),
    ),
    posts,
  };
}

export function normalizeVenueOperationsConfig(raw: unknown): VenueOperationsConfig {
  const parsed = venueOperationsConfigSchema.safeParse(raw);
  if (parsed.success) {
    return finalizeVenueOperationsConfig(parsed.data);
  }
  return finalizeVenueOperationsConfig({ enabledStations: [...DEFAULT_ENABLED_STATIONS] });
}

export function mergeVenueOperationsConfig(
  current: VenueOperationsConfig,
  patch: VenueOperationsConfigPatch,
): VenueOperationsConfig {
  const merged: VenueOperationsConfig = {
    posts: patch.posts !== undefined ? patch.posts : current.posts,
    enabledStations: patch.enabledStations
      ? uniqueStations(patch.enabledStations)
      : current.enabledStations,
    stationLabels:
      patch.stationLabels !== undefined ? patch.stationLabels : current.stationLabels,
    quickChips: patch.quickChips !== undefined ? patch.quickChips : current.quickChips,
    tableStateLabels:
      patch.tableStateLabels !== undefined ? patch.tableStateLabels : current.tableStateLabels,
    hiddenTableStates:
      patch.hiddenTableStates !== undefined ? patch.hiddenTableStates : current.hiddenTableStates,
    postColors: patch.postColors !== undefined ? patch.postColors : current.postColors,
    zoneLabels: patch.zoneLabels !== undefined ? patch.zoneLabels : current.zoneLabels,
  };
  return normalizeVenueOperationsConfig(merged);
}

export function isPassStationEnabled(
  config: VenueOperationsConfig,
  station: PassStationInput,
): boolean {
  return config.enabledStations.includes(station);
}

export function stationDisplayLabel(
  config: VenueOperationsConfig | undefined,
  station: PassStationInput,
  lang: "GR" | "EN" = "GR",
): string {
  const fallback =
    lang === "EN" ? DEFAULT_STATION_LABELS_EN[station] : DEFAULT_STATION_LABELS_EL[station];
  const fromPosts = listVenuePosts(config, lang)
    .filter((post) => post.enabled && post.station === station)
    .map((post) => post.label.trim())
    .filter(Boolean);
  const uniquePostNames = [...new Set(fromPosts)];
  if (uniquePostNames.length === 1) return uniquePostNames[0]!;
  if (uniquePostNames.length > 1) return uniquePostNames.join(" · ");
  const custom = config?.stationLabels?.[station]?.trim();
  if (custom) return custom;
  return fallback;
}

export function passPushTitle(
  config: VenueOperationsConfig | undefined,
  station: PassStationInput,
  lang: "GR" | "EN" = "GR",
): string {
  const name = stationDisplayLabel(config, station, lang);
  switch (station) {
    case "kitchen":
      return lang === "EN" ? `Pass pickup — ${name}` : `Έλα πάσο — ${name}`;
    case "bar":
      return lang === "EN" ? `Ready — ${name}` : `Έτοιμο — ${name}`;
    case "cold":
      return lang === "EN" ? `Ready — ${name}` : `Έτοιμο — ${name}`;
    case "dessert":
      return lang === "EN" ? `Ready — ${name}` : `Έτοιμο — ${name}`;
    default:
      return lang === "EN" ? "Pass alert" : "Ειδοποίηση πάσου";
  }
}

/** Messages tab editor: respect explicit post key (even empty); else legacy/fallback. */
export function editorQuickChipsForPost(
  config: VenueOperationsConfig | undefined,
  postId: string,
  lang: "GR" | "EN" = "GR",
): string[] {
  if (!config?.quickChips || !Object.prototype.hasOwnProperty.call(config.quickChips, postId)) {
    return quickChipsForPost(config, postId, lang);
  }
  return config.quickChips[postId] ?? [];
}

/** True when this post has a saved override in quickChips (including explicit empty list). */
export function postHasExplicitQuickChips(
  config: VenueOperationsConfig | undefined,
  postId: string,
): boolean {
  return Boolean(
    config?.quickChips && Object.prototype.hasOwnProperty.call(config.quickChips, postId),
  );
}

export function quickChipsForPost(
  config: VenueOperationsConfig | undefined,
  postId: string,
  lang: "GR" | "EN" = "GR",
): string[] {
  const posts = listVenuePosts(config, lang);
  const post = posts.find((row) => row.id === postId);
  const byId = config?.quickChips?.[postId];
  if (byId !== undefined) return byId;

  if (post) {
    const legacyStation = config?.quickChips?.[post.station];
    if (legacyStation !== undefined) {
      const sameStation = posts.filter((row) => row.enabled && row.station === post.station);
      if (sameStation.length === 1 || sameStation[0]?.id === postId) {
        return legacyStation;
      }
    }
    return [];
  }

  return [];
}

export function resolvePostIdForStationScreen(
  config: VenueOperationsConfig,
  station: PassStationInput,
  screenLabel?: string | null,
  lang: "GR" | "EN" = "GR",
): string | null {
  const posts = enabledVenuePosts(config, lang).filter((post) => post.station === station);
  const label = screenLabel?.trim();
  if (label) {
    const match = posts.find((post) => post.label.trim() === label);
    if (match) return match.id;
  }
  return posts[0]?.id ?? null;
}

/** True when screen label equals an enabled post name for this station (recommended 1:1 link). */
export function stationScreenLabelMatchesPost(
  config: VenueOperationsConfig | undefined,
  station: PassStationInput,
  screenLabel: string,
  lang: "GR" | "EN" = "GR",
): boolean {
  if (!config) return true;
  const label = screenLabel.trim();
  if (!label) return false;
  return enabledVenuePosts(config, lang).some(
    (post) => post.station === station && post.label.trim() === label,
  );
}

export type StaffVisibleMessages =
  | { kind: "waiter_map"; labels: string[] }
  | { kind: "pass_quick"; labels: string[] };

/** Message scope ids from Ρυθμίσεις → Μηνύματα (enabled posts only). */
export function listStaffMessageScopeIds(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): string[] {
  return enabledVenuePosts(config, lang).map((post) => post.id);
}

/** Messages a staff member sees for a scope (services = map labels; post = pass quick chips). */
export function visibleMessagesForStaffAssignment(
  config: VenueOperationsConfig | undefined,
  assignment: string,
  lang: "GR" | "EN" = "GR",
): StaffVisibleMessages {
  const posts = listVenuePosts(config, lang);
  const post = posts.find((row) => row.id === assignment);
  if (assignment === "services" || assignment === "all" || post?.station === "services") {
    const merged = mergeTableStateLabels(config, lang);
    const states = tableLegendStates(config);
    return { kind: "waiter_map", labels: states.map((state) => merged[state]) };
  }
  return { kind: "pass_quick", labels: quickChipsForPost(config, assignment, lang) };
}

export function quickChipsForStation(
  config: VenueOperationsConfig,
  station: PassStationInput,
  opts?: { screenLabel?: string | null; postId?: string | null; lang?: "GR" | "EN" },
): string[] {
  const lang = opts?.lang ?? "GR";
  const postId =
    opts?.postId?.trim() ||
    resolvePostIdForStationScreen(config, station, opts?.screenLabel, lang);
  if (postId) return quickChipsForPost(config, postId, lang);

  const custom = config.quickChips?.[station];
  if (custom !== undefined) return custom;
  return [];
}

export function mergeTableStateLabels(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): Record<TableTileState, string> {
  const defaults = lang === "EN" ? DEFAULT_TABLE_STATE_LABELS_EN : DEFAULT_TABLE_STATE_LABELS_EL;
  const prefix = lang === "EN" ? "Ready — " : "Έτοιμο — ";
  const readyFromPosts = (stations: PassStationInput[]) => {
    const names = [
      ...new Set(
        listVenuePosts(config, lang)
          .filter(
            (post) =>
              post.enabled &&
              isVenuePassPostStation(post.station) &&
              stations.includes(post.station),
          )
          .map((post) => post.label.trim())
          .filter(Boolean),
      ),
    ];
    if (names.length > 0) return prefix + names.join(" · ");
    const station = stations[0]!;
    return (
      prefix +
      (lang === "EN" ? DEFAULT_STATION_LABELS_EN[station] : DEFAULT_STATION_LABELS_EL[station])
    );
  };
  const fromPosts: Partial<Record<TableTileState, string>> = {
    kitchen_ready: readyFromPosts(["kitchen"]),
    cold_ready: readyFromPosts(["cold"]),
    bar_ready: readyFromPosts(["bar", "dessert"]),
  };
  return { ...defaults, ...fromPosts, ...(config?.tableStateLabels ?? {}) };
}

/** Pass badge labels on the waiter map — same text as configured map states. */
export function passReadyLabelsFromConfig(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): Record<PassStationInput, string> {
  const merged = mergeTableStateLabels(config, lang);
  return {
    kitchen: merged.kitchen_ready,
    bar: merged.bar_ready,
    cold: merged.cold_ready,
    dessert: merged.bar_ready,
  };
}

export function passReadyLabelForSignal(
  config: VenueOperationsConfig | undefined,
  pass: { station: string; stationScreenLabel?: string | null },
  lang: "GR" | "EN" = "GR",
): string {
  const station = passStationDbToInput(pass.station);
  const merged = mergeTableStateLabels(config, lang);
  const stateKey: TableTileState =
    station === "kitchen" ? "kitchen_ready" : station === "cold" ? "cold_ready" : "bar_ready";
  const custom = config?.tableStateLabels?.[stateKey]?.trim();
  if (custom) return custom;

  if (config) {
    const postId = resolvePostIdForStationScreen(config, station, pass.stationScreenLabel, lang);
    if (postId) {
      const post = listVenuePosts(config, lang).find((row) => row.id === postId);
      if (post?.label.trim()) {
        const prefix = lang === "EN" ? "Ready — " : "Έτοιμο — ";
        return prefix + post.label.trim();
      }
    }
  }

  return merged[stateKey];
}

export function tableLegendStates(
  config: VenueOperationsConfig | undefined,
): TableTileState[] {
  const hidden = new Set(config?.hiddenTableStates ?? []);
  const states: TableTileState[] = ["idle", "guest_call"];
  if (!config) {
    return TABLE_TILE_STATES.filter((state) => !hidden.has(state));
  }
  if (isPassStationEnabled(config, "kitchen") && !hidden.has("kitchen_ready")) {
    states.push("kitchen_ready");
  }
  if (isPassStationEnabled(config, "cold") && !hidden.has("cold_ready")) {
    states.push("cold_ready");
  }
  if (
    (isPassStationEnabled(config, "bar") || isPassStationEnabled(config, "dessert")) &&
    !hidden.has("bar_ready")
  ) {
    states.push("bar_ready");
  }
  if (!hidden.has("both")) states.push("both");
  return states;
}

/** Optional map states the venue can re-enable in settings. */
export function restorableTableStates(
  config: VenueOperationsConfig | undefined,
): TableTileState[] {
  const hidden = new Set(config?.hiddenTableStates ?? []);
  const optional: TableTileState[] = [];
  if (!config) return [];
  if (isPassStationEnabled(config, "kitchen") && hidden.has("kitchen_ready")) {
    optional.push("kitchen_ready");
  }
  if (isPassStationEnabled(config, "cold") && hidden.has("cold_ready")) {
    optional.push("cold_ready");
  }
  if (
    (isPassStationEnabled(config, "bar") || isPassStationEnabled(config, "dessert")) &&
    hidden.has("bar_ready")
  ) {
    optional.push("bar_ready");
  }
  if (hidden.has("both")) optional.push("both");
  return optional;
}

export function applyZoneLabelOverrides(
  groups: SpotZoneGroup[],
  overrides?: Record<string, string>,
): SpotZoneGroup[] {
  if (!overrides || Object.keys(overrides).length === 0) return groups;
  return groups.map((group) => {
    const custom = overrides[group.id]?.trim();
    return custom ? { ...group, label: custom } : group;
  });
}

export function settingsKitchenTabVisible(config: VenueOperationsConfig): boolean {
  return (
    isPassStationEnabled(config, "kitchen") || isPassStationEnabled(config, "cold")
  );
}

export function settingsBarTabVisible(config: VenueOperationsConfig): boolean {
  return isPassStationEnabled(config, "bar") || isPassStationEnabled(config, "dessert");
}

export function filterEnabledPassStationFilters<T extends { id: string }>(
  filters: T[],
  config: VenueOperationsConfig,
): T[] {
  return filters.filter((f) => {
    if (f.id === "all") return true;
    return isPassStationEnabled(config, f.id as PassStationInput);
  });
}
