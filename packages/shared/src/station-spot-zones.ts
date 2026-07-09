import type { VenueSpotLang, VenueSpotType } from "./venue-spots";
import { formatWaiterCallLocationForLang, normalizeWaiterCallLocation, spotToQueryParams } from "./venue-spots";

export type ZoneSpotInput = { type: VenueSpotType; label: string };

export type ZoneSpotEntry = {
  spot: ZoneSpotInput;
  /** Short label on the tile (e.g. «2» inside tab «Αυλή»). */
  displayLabel: string;
};

export type SpotZoneGroup = {
  id: string;
  label: string;
  spots: ZoneSpotEntry[];
};

const MAIN_ZONE_ID = "main";
const MAIN_ZONE_LABEL = "Τραπέζια";
const SUNBED_ZONE_ID = "sunbed";
const SUNBED_ZONE_LABEL = "Ξαπλώστρες";
const ROOM_ZONE_ID = "room";
const ROOM_ZONE_LABEL = "Δωμάτια";

const ZONE_SORT: Record<string, number> = {
  [MAIN_ZONE_ID]: 0,
  [SUNBED_ZONE_ID]: 100,
  [ROOM_ZONE_ID]: 101,
};

function tableZoneFromLabel(label: string): { id: string; label: string; displayLabel: string } {
  const trimmed = label.trim();
  const dash = trimmed.indexOf("-");
  if (dash > 0) {
    const prefix = trimmed.slice(0, dash);
    const suffix = trimmed.slice(dash + 1).trim();
    return {
      id: `prefix:${prefix.toLowerCase()}`,
      label: prefix,
      displayLabel: suffix || trimmed,
    };
  }
  return { id: MAIN_ZONE_ID, label: MAIN_ZONE_LABEL, displayLabel: trimmed };
}

/** Parse prefixed table label (e.g. «Κήπο-10») into zone + display number. */
export function parseTableSpotLabel(label: string): {
  zoneId: string;
  zoneLabel: string;
  displayLabel: string;
} | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed.indexOf("-") <= 0) return null;
  const parsed = tableZoneFromLabel(trimmed);
  if (parsed.id === MAIN_ZONE_ID) return null;
  return {
    zoneId: parsed.id,
    zoneLabel: parsed.label,
    displayLabel: parsed.displayLabel,
  };
}

function compareSpotLabels(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b, "el");
}

function zoneSortKey(id: string): number {
  if (id in ZONE_SORT) return ZONE_SORT[id]!;
  return 50;
}

/** Group venue spots into zones for KDS / pass-screen tabs. */
export function groupVenueSpotsByZone(spots: ZoneSpotInput[]): SpotZoneGroup[] {
  const map = new Map<string, SpotZoneGroup>();

  for (const spot of spots) {
    let id: string;
    let label: string;
    let displayLabel: string;

    if (spot.type === "SUNBED") {
      id = SUNBED_ZONE_ID;
      label = SUNBED_ZONE_LABEL;
      displayLabel = spot.label.trim();
    } else if (spot.type === "ROOM") {
      id = ROOM_ZONE_ID;
      label = ROOM_ZONE_LABEL;
      displayLabel = spot.label.trim();
    } else {
      const parsed = tableZoneFromLabel(spot.label);
      id = parsed.id;
      label = parsed.label;
      displayLabel = parsed.displayLabel;
    }

    const group = map.get(id) ?? { id, label, spots: [] };
    if (!map.has(id)) {
      group.label = label;
    }
    group.spots.push({ spot, displayLabel });
    map.set(id, group);
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      spots: [...group.spots].sort((a, b) => compareSpotLabels(a.displayLabel, b.displayLabel)),
    }))
    .sort((a, b) => {
      const order = zoneSortKey(a.id) - zoneSortKey(b.id);
      if (order !== 0) return order;
      return a.label.localeCompare(b.label, "el");
    });
}

export function findZoneIdForSpot(groups: SpotZoneGroup[], spot: ZoneSpotInput): string | null {
  for (const group of groups) {
    if (group.spots.some((entry) => entry.spot.type === spot.type && entry.spot.label === spot.label)) {
      return group.id;
    }
  }
  return null;
}

export function pickDefaultZoneId(groups: SpotZoneGroup[]): string | null {
  return groups[0]?.id ?? null;
}

/** Display label for a zone id when spots are not resolved (e.g. prefix:σαλα → «σαλα»). */
export function spotZoneDisplayLabel(zoneId: string): string | null {
  const id = zoneId?.trim();
  if (!id || id === MAIN_ZONE_ID || id === "all") return null;
  if (id === SUNBED_ZONE_ID) return SUNBED_ZONE_LABEL;
  if (id === ROOM_ZONE_ID) return ROOM_ZONE_LABEL;
  if (id.startsWith("prefix:")) {
    const name = id.slice("prefix:".length).trim();
    return name || null;
  }
  return null;
}

/** Human hint for where a zone comes from (settings UI). */
export function zoneSourceHint(zone: SpotZoneGroup, lang: "GR" | "EN" = "GR"): string {
  if (zone.id.startsWith("prefix:")) {
    return lang === "EN"
      ? `Spots like «${zone.label}-1»`
      : `Θέσεις τύπου «${zone.label}-1»`;
  }
  if (zone.id === MAIN_ZONE_ID) {
    return lang === "EN" ? "Tables without prefix (e.g. 12)" : "Τραπέζια χωρίς prefix (π.χ. 12)";
  }
  if (zone.id === SUNBED_ZONE_ID) {
    return lang === "EN" ? "Sunbed spot type" : "Τύπος ξαπλώστρα";
  }
  if (zone.id === ROOM_ZONE_ID) {
    return lang === "EN" ? "Room spot type" : "Τύπος δωμάτιο";
  }
  return zone.id;
}

type WaiterLocationLike = {
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
};

export type ResolvedWaiterLocationSpot = {
  zoneId: string;
  spot: ZoneSpotInput;
};

function normalizeTableToken(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return String(Number.parseInt(trimmed, 10));
  return trimmed;
}

/** Match KDS manual entry (e.g. «12») to configured spot label (e.g. «Σαλα-12»). */
export function resolveWaiterLocationInZones(
  location: WaiterLocationLike,
  groups: SpotZoneGroup[],
): ResolvedWaiterLocationSpot | null {
  if (groups.length === 0) return null;

  const normalized = normalizeWaiterCallLocation(location);

  if (normalized.tableNumber) {
    const table = normalized.tableNumber;
    const exact: ResolvedWaiterLocationSpot[] = [];
    const byDisplay: ResolvedWaiterLocationSpot[] = [];

    for (const group of groups) {
      for (const entry of group.spots) {
        if (entry.spot.type !== "TABLE") continue;
        if (entry.spot.label === table) {
          exact.push({ zoneId: group.id, spot: entry.spot });
          continue;
        }
        const displayNorm = normalizeTableToken(entry.displayLabel);
        const tableNorm = normalizeTableToken(table);
        if (displayNorm === tableNorm || entry.displayLabel.trim() === table) {
          byDisplay.push({ zoneId: group.id, spot: entry.spot });
        }
      }
    }

    if (exact.length === 1) return exact[0]!;
    if (exact.length > 1) return null;
    if (byDisplay.length === 1) return byDisplay[0]!;
    return null;
  }

  if (normalized.roomNumber) {
    for (const group of groups) {
      for (const entry of group.spots) {
        if (entry.spot.type === "ROOM" && entry.spot.label === normalized.roomNumber) {
          return { zoneId: group.id, spot: entry.spot };
        }
      }
    }
    return null;
  }

  if (normalized.sunbedNumber) {
    for (const group of groups) {
      for (const entry of group.spots) {
        if (entry.spot.type === "SUNBED" && entry.spot.label === normalized.sunbedNumber) {
          return { zoneId: group.id, spot: entry.spot };
        }
      }
    }
    return null;
  }

  return null;
}

/** Resolve zone tab id for a waiter call / pass location (needs groups from venue spots). */
export function zoneIdForWaiterLocation(
  location: WaiterLocationLike,
  groups: SpotZoneGroup[],
): string | null {
  return resolveWaiterLocationInZones(location, groups)?.zoneId ?? null;
}

/**
 * Zone id for UI filters — falls back to per-zone match when bare table numbers
 * are unique in one tab (e.g. «1» in Σάλα but not Αυλή).
 */
export function zoneIdForWaiterLocationView(
  location: WaiterLocationLike,
  groups: SpotZoneGroup[],
): string | null {
  const direct = zoneIdForWaiterLocation(location, groups);
  if (direct) return direct;
  const hits: string[] = [];
  for (const group of groups) {
    if (resolveWaiterLocationInZone(location, group.id, groups)) hits.push(group.id);
  }
  return hits.length === 1 ? hits[0]! : null;
}

/** KDS / waiter card label with zone prefix, e.g. «Σάλα · Τραπέζι 1». */
export function formatWaiterCallLocationWithZone(
  location: WaiterLocationLike,
  groups: SpotZoneGroup[],
  options?: { activeZoneId?: string | null; lang?: VenueSpotLang },
): string {
  const lang = options?.lang ?? "GR";
  const resolved = options?.activeZoneId?.trim()
    ? resolveWaiterLocationInZone(location, options.activeZoneId, groups)
    : resolveWaiterLocationInZones(location, groups);

  if (!resolved) {
    return formatWaiterCallLocationForLang(location, lang);
  }

  const group = groups.find((row) => row.id === resolved.zoneId);
  const entry = group?.spots.find(
    (row) => row.spot.type === resolved.spot.type && row.spot.label === resolved.spot.label,
  );

  const spotLocation =
    resolved.spot.type === "TABLE"
      ? { tableNumber: entry?.displayLabel ?? resolved.spot.label }
      : resolved.spot.type === "ROOM"
        ? { roomNumber: resolved.spot.label }
        : { sunbedNumber: resolved.spot.label };

  const spotLabel = formatWaiterCallLocationForLang(spotLocation, lang);
  const zoneLabel = group?.label?.trim();
  if (zoneLabel && resolved.zoneId !== MAIN_ZONE_ID) {
    return `${zoneLabel} · ${spotLabel}`;
  }
  return spotLabel;
}

/** Resolve a location within one zone tab (KDS manual entry). */
export function resolveWaiterLocationInZone(
  location: WaiterLocationLike,
  zoneId: string | null | undefined,
  groups: SpotZoneGroup[],
): ResolvedWaiterLocationSpot | null {
  if (!zoneId?.trim()) return resolveWaiterLocationInZones(location, groups);
  const zone = groups.find((group) => group.id === zoneId.trim());
  if (!zone) return resolveWaiterLocationInZones(location, groups);
  return resolveWaiterLocationInZones(location, [zone]);
}

/** Pick the stored spot label for pass send (disambiguates bare table numbers by zone). */
export function passSendTableNumber(
  table: ZoneSpotInput | null,
  manual: string,
  activeZoneId: string | null | undefined,
  groups: SpotZoneGroup[],
): string {
  if (table) {
    const label = table.label.trim();
    const zoneId = activeZoneId?.trim();
    if (zoneId && zoneId !== MAIN_ZONE_ID && !parseTableSpotLabel(label) && /^[0-9]+$/.test(label)) {
      const zone = groups.find((group) => group.id === zoneId);
      const zoneLabel = zone?.label.trim();
      if (zoneLabel) return `${zoneLabel}-${label}`;
    }
    return table.label;
  }
  const trimmed = manual.trim();
  if (!trimmed) return trimmed;
  const resolved = resolveWaiterLocationInZone({ tableNumber: trimmed }, activeZoneId, groups);
  return resolved?.spot.label ?? trimmed;
}

export function filterSpotsByZone<T extends ZoneSpotInput & { id?: string }>(
  spots: T[],
  zoneId: string,
  groups: SpotZoneGroup[],
): T[] {
  if (zoneId === "all") return spots;
  return spots.filter((spot) => findZoneIdForSpot(groups, spot) === zoneId);
}

export function filterWaiterLocationsByZone<T extends WaiterLocationLike>(
  items: T[],
  zoneId: string,
  groups: SpotZoneGroup[],
): T[] {
  if (zoneId === "all") return items;
  return items.filter((item) => zoneIdForWaiterLocationView(item, groups) === zoneId);
}

/** Zone filter — unmapped locations only appear under «Όλοι οι χώροι». */
export function filterWaiterLocationsForZoneView<T extends WaiterLocationLike & { id?: string }>(
  items: T[],
  zoneId: string,
  groups: SpotZoneGroup[],
): T[] {
  if (zoneId === "all") return items;
  return filterWaiterLocationsByZone(items, zoneId, groups);
}

export type PassSignalLocationMatch = {
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
};

/** Location variants stored on PassSignal for spots in one zone (history SQL filter). */
export function passSignalLocationMatchesForZone(group: SpotZoneGroup): PassSignalLocationMatch[] {
  const matches: PassSignalLocationMatch[] = [];
  const seen = new Set<string>();

  const add = (table: string | null, room: string | null, sunbed: string | null) => {
    const key = `${table ?? ""}|${room ?? ""}|${sunbed ?? ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ tableNumber: table, roomNumber: room, sunbedNumber: sunbed });
  };

  for (const entry of group.spots) {
    const loc = spotToQueryParams(entry.spot.type, entry.spot.label);
    add(loc.table ?? null, loc.room ?? null, loc.sunbed ?? null);

    if (
      entry.spot.type === "TABLE" &&
      group.id !== MAIN_ZONE_ID &&
      !parseTableSpotLabel(entry.spot.label) &&
      /^[0-9]+$/.test(entry.displayLabel)
    ) {
      const zoneLabel = group.label.trim();
      if (zoneLabel) add(`${zoneLabel}-${entry.displayLabel}`, null, null);
    }
  }

  return matches;
}
