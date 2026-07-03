import { z } from "zod";
import {
  PASS_STATION_INPUTS,
  passStationInputSchema,
  type PassStationInput,
} from "./pass-signal";
import { TABLE_TILE_STATES, type TableTileState } from "./waiter-table-grid";
import type { SpotZoneGroup } from "./station-spot-zones";

export const DEFAULT_ENABLED_STATIONS: PassStationInput[] = [...PASS_STATION_INPUTS];

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

export const venuePostSchema = z.object({
  id: z.string().trim().min(1).max(40),
  label: stationLabelSchema,
  enabled: z.boolean(),
  station: passStationInputSchema,
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
    .object({
      kitchen: z.array(quickChipSchema).max(12),
      bar: z.array(quickChipSchema).max(12),
      cold: z.array(quickChipSchema).max(12),
      dessert: z.array(quickChipSchema).max(12),
    })
    .partial()
    .optional(),
  tableStateLabels: z.record(tableTileStateSchema, zoneLabelSchema).optional(),
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
  const labels = lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
  return PASS_STATION_INPUTS.map((station) => ({
    id: station,
    label: labels[station],
    enabled: true,
    station,
  }));
}

export function postsFromLegacy(
  config: Pick<VenueOperationsConfig, "enabledStations" | "stationLabels">,
  lang: "GR" | "EN" = "GR",
): VenuePost[] {
  const labels = lang === "EN" ? DEFAULT_STATION_LABELS_EN : DEFAULT_STATION_LABELS_EL;
  return PASS_STATION_INPUTS.map((station) => ({
    id: station,
    label: config.stationLabels?.[station]?.trim() || labels[station],
    enabled: config.enabledStations.includes(station),
    station,
  }));
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

export function syncLegacyFromPosts(
  posts: VenuePost[],
): Pick<VenueOperationsConfig, "enabledStations" | "stationLabels"> {
  const enabled = posts.filter((post) => post.enabled);
  const enabledStations = uniqueStations(enabled.map((post) => post.station));
  const stationLabels: NonNullable<VenueOperationsConfig["stationLabels"]> = {};
  for (const post of enabled) {
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

function finalizeVenueOperationsConfig(
  data: Omit<VenueOperationsConfig, "posts"> & { posts?: VenuePost[] },
): VenueOperationsConfig {
  let posts = data.posts?.length ? data.posts : postsFromLegacy(data);
  if (!posts.some((post) => post.enabled)) {
    posts = posts.map((post, index) => ({ ...post, enabled: index === 0 }));
  }
  const legacy = syncLegacyFromPosts(posts);
  return {
    ...data,
    ...legacy,
    enabledStations: uniqueStations(legacy.enabledStations),
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
  const custom = config?.stationLabels?.[station]?.trim();
  if (custom) return custom;
  return lang === "EN" ? DEFAULT_STATION_LABELS_EN[station] : DEFAULT_STATION_LABELS_EL[station];
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

export function quickChipsForStation(
  config: VenueOperationsConfig,
  station: PassStationInput,
): string[] {
  const custom = config.quickChips?.[station];
  if (custom && custom.length > 0) return custom;
  return DEFAULT_PASS_QUICK_CHIPS[station];
}

export function mergeTableStateLabels(
  config: VenueOperationsConfig | undefined,
  lang: "GR" | "EN" = "GR",
): Record<TableTileState, string> {
  const defaults = lang === "EN" ? DEFAULT_TABLE_STATE_LABELS_EN : DEFAULT_TABLE_STATE_LABELS_EL;
  return { ...defaults, ...(config?.tableStateLabels ?? {}) };
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
