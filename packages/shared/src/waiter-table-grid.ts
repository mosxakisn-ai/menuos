import { spotToQueryParams, waiterCallLocationMatches, type VenueSpotType, type WaiterCallLocation } from "./venue-spots";
import type { OrderPayload } from "./menu-cart";

export const TABLE_TILE_STATES = [
  "idle",
  "guest_call",
  "kitchen_ready",
  "cold_ready",
  "bar_ready",
  "both",
] as const;
export type TableTileState = (typeof TABLE_TILE_STATES)[number];

export type TableGridSpot = { id: string; type: VenueSpotType; label: string };

export type TableGridCall = {
  id?: string;
  type: string;
  status: string;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
  orderItems?: OrderPayload | null;
  createdAt?: string;
  updatedAt?: string;
};

export type TableGridPassSignal = {
  id?: string;
  station: string;
  status?: string;
  stationScreenLabel?: string | null;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
  message?: string | null;
  readyAt?: string;
};

export type TableGridTile = {
  spotId: string;
  label: string;
  state: TableTileState;
  activeCalls: TableGridCall[];
  activePasses: TableGridPassSignal[];
};

const ACTIVE_CALL_STATUSES = new Set(["PENDING", "ACKNOWLEDGED"]);

/** Synthetic spot id prefix for calls/passes with no matching configured spot. */
export const UNMAPPED_SPOT_ID_PREFIX = "__unmapped__:";

function locationKey(location: WaiterCallLocation): string {
  if (location.tableNumber) return `TABLE:${location.tableNumber}`;
  if (location.roomNumber) return `ROOM:${location.roomNumber}`;
  if (location.sunbedNumber) return `SUNBED:${location.sunbedNumber}`;
  return "NONE";
}

function isMatchedByAnySpot(spots: TableGridSpot[], location: WaiterCallLocation): boolean {
  return spots.some((spot) => matchesSpot(spot, location));
}

function spotLocationRequest(spot: TableGridSpot): {
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
} {
  const params = spotToQueryParams(spot.type, spot.label);
  return {
    tableNumber: params.table,
    roomNumber: params.room,
    sunbedNumber: params.sunbed,
  };
}

function matchesSpot(spot: TableGridSpot, location: WaiterCallLocation): boolean {
  return waiterCallLocationMatches(location, spotLocationRequest(spot));
}

function isKitchenStation(station: string): boolean {
  return station === "KITCHEN";
}

function isColdStation(station: string): boolean {
  return station === "COLD";
}

function isBarStation(station: string): boolean {
  return station === "BAR" || station === "DESSERT";
}

function resolveTileState(
  hasGuest: boolean,
  hasKitchen: boolean,
  hasCold: boolean,
  hasBar: boolean,
): TableTileState {
  const categoryCount = [hasGuest, hasKitchen, hasCold, hasBar].filter(Boolean).length;
  if (categoryCount >= 2) return "both";
  if (hasGuest) return "guest_call";
  if (hasKitchen) return "kitchen_ready";
  if (hasCold) return "cold_ready";
  if (hasBar) return "bar_ready";
  return "idle";
}

export function buildTableGridTiles(
  spots: TableGridSpot[],
  calls: TableGridCall[],
  passSignals: TableGridPassSignal[],
  options?: { includeUnmapped?: boolean },
): TableGridTile[] {
  const activeCalls = calls.filter((c) => ACTIVE_CALL_STATUSES.has(c.status));
  const includeUnmapped = options?.includeUnmapped ?? spots.length === 0;

  const tiles = spots.map((spot) => {
    const spotCalls = activeCalls.filter((c) => matchesSpot(spot, c));
    const spotPasses = passSignals.filter((p) => matchesSpot(spot, p));
    const hasGuest = spotCalls.length > 0;
    const hasKitchen = spotPasses.some((p) => isKitchenStation(p.station));
    const hasCold = spotPasses.some((p) => isColdStation(p.station));
    const hasBar = spotPasses.some((p) => isBarStation(p.station));

    return {
      spotId: spot.id,
      label: spot.label,
      state: resolveTileState(hasGuest, hasKitchen, hasCold, hasBar),
      activeCalls: spotCalls.map((c) => ({ ...c })),
      activePasses: spotPasses.map((p) => ({ ...p, message: p.message ?? null })),
    };
  });

  if (!includeUnmapped) return tiles;

  const unmappedCalls = activeCalls.filter((c) => !isMatchedByAnySpot(spots, c));
  const unmappedPasses = passSignals.filter((p) => !isMatchedByAnySpot(spots, p));
  const groups = new Map<string, { calls: TableGridCall[]; passes: TableGridPassSignal[] }>();

  for (const call of unmappedCalls) {
    const key = locationKey(call);
    const group = groups.get(key) ?? { calls: [], passes: [] };
    group.calls.push(call);
    groups.set(key, group);
  }
  for (const pass of unmappedPasses) {
    const key = locationKey(pass);
    const group = groups.get(key) ?? { calls: [], passes: [] };
    group.passes.push(pass);
    groups.set(key, group);
  }

  for (const [key, group] of groups) {
    const sample = group.calls[0] ?? group.passes[0];
    const label =
      sample?.tableNumber ?? sample?.roomNumber ?? sample?.sunbedNumber ?? "?";
    const hasGuest = group.calls.length > 0;
    const hasKitchen = group.passes.some((p) => isKitchenStation(p.station));
    const hasCold = group.passes.some((p) => isColdStation(p.station));
    const hasBar = group.passes.some((p) => isBarStation(p.station));

    tiles.push({
      spotId: `${UNMAPPED_SPOT_ID_PREFIX}${key}`,
      label,
      state: resolveTileState(hasGuest, hasKitchen, hasCold, hasBar),
      activeCalls: group.calls.map((c) => ({ ...c })),
      activePasses: group.passes.map((p) => ({ ...p, message: p.message ?? null })),
    });
  }

  return tiles;
}
