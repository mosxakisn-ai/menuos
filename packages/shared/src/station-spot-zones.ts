import type { VenueSpotType } from "./venue-spots";

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
const MAIN_ZONE_LABEL = "Σαλόνι";
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

export function pickDefaultZoneId(groups: SpotZoneGroup[]): string | null {
  return groups[0]?.id ?? null;
}
