import { spotToQueryParams, waiterCallLocationMatches, type VenueSpotType, type WaiterCallLocation } from "./venue-spots";

export const TABLE_TILE_STATES = ["idle", "guest_call", "kitchen_ready", "bar_ready", "both"] as const;
export type TableTileState = (typeof TABLE_TILE_STATES)[number];

export type TableGridSpot = { id: string; type: VenueSpotType; label: string };

export type TableGridCall = {
  type: string;
  status: string;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
};

export type TableGridPassSignal = {
  station: string;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
  message?: string | null;
};

export type TableGridTile = {
  spotId: string;
  label: string;
  state: TableTileState;
  activeCalls: Pick<TableGridCall, "type" | "status">[];
  activePasses: Pick<TableGridPassSignal, "station" | "message">[];
};

const ACTIVE_CALL_STATUSES = new Set(["PENDING", "ACKNOWLEDGED"]);

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
  return station === "KITCHEN" || station === "COLD";
}

function isBarStation(station: string): boolean {
  return station === "BAR" || station === "DESSERT";
}

function resolveTileState(
  hasGuest: boolean,
  hasKitchen: boolean,
  hasBar: boolean,
): TableTileState {
  const categoryCount = [hasGuest, hasKitchen, hasBar].filter(Boolean).length;
  if (categoryCount >= 2 || (hasKitchen && hasBar)) return "both";
  if (hasGuest) return "guest_call";
  if (hasKitchen) return "kitchen_ready";
  if (hasBar) return "bar_ready";
  return "idle";
}

export function buildTableGridTiles(
  spots: TableGridSpot[],
  calls: TableGridCall[],
  passSignals: TableGridPassSignal[],
): TableGridTile[] {
  const activeCalls = calls.filter((c) => ACTIVE_CALL_STATUSES.has(c.status));

  return spots.map((spot) => {
    const spotCalls = activeCalls.filter((c) => matchesSpot(spot, c));
    const spotPasses = passSignals.filter((p) => matchesSpot(spot, p));
    const hasGuest = spotCalls.length > 0;
    const hasKitchen = spotPasses.some((p) => isKitchenStation(p.station));
    const hasBar = spotPasses.some((p) => isBarStation(p.station));

    return {
      spotId: spot.id,
      label: spot.label,
      state: resolveTileState(hasGuest, hasKitchen, hasBar),
      activeCalls: spotCalls.map((c) => ({ type: c.type, status: c.status })),
      activePasses: spotPasses.map((p) => ({ station: p.station, message: p.message ?? null })),
    };
  });
}
