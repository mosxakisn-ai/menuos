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

const tableTileStateSchema = z.enum(
  TABLE_TILE_STATES as unknown as [TableTileState, ...TableTileState[]],
);

const quickChipSchema = z.string().trim().min(1).max(60);
const zoneLabelSchema = z.string().trim().min(1).max(40);

export const venueOperationsConfigSchema = z.object({
  enabledStations: z.array(passStationInputSchema).min(1).max(4),
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

export function normalizeVenueOperationsConfig(raw: unknown): VenueOperationsConfig {
  const parsed = venueOperationsConfigSchema.safeParse(raw);
  if (parsed.success) {
    return {
      ...parsed.data,
      enabledStations: uniqueStations(parsed.data.enabledStations),
    };
  }
  return { enabledStations: [...DEFAULT_ENABLED_STATIONS] };
}

export function mergeVenueOperationsConfig(
  current: VenueOperationsConfig,
  patch: VenueOperationsConfigPatch,
): VenueOperationsConfig {
  const merged: VenueOperationsConfig = {
    enabledStations: patch.enabledStations
      ? uniqueStations(patch.enabledStations)
      : current.enabledStations,
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
