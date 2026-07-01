import type { VenueSpotType } from "./venue-spots";

export type ScreenSpotInput = { type: VenueSpotType; label: string };

export type PassSignalLocation = {
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
};

/** Filter value for numeric main-hall tables (1, 2, 3…). */
export const MAIN_HALL_SPOT_PREFIX = "Σαλόνι";

const spotPrefixPattern = /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_-]*$/;

function prefixKey(raw: string): string {
  return raw.trim().toLocaleLowerCase("el");
}

function isMainHallPrefix(spotPrefix: string): boolean {
  return prefixKey(spotPrefix) === prefixKey(MAIN_HALL_SPOT_PREFIX);
}

function tableLabelMatchesPrefix(label: string, prefix: string): boolean {
  const key = prefixKey(label);
  const pKey = prefixKey(prefix);
  return key === pKey || key.startsWith(`${pKey}-`);
}

export function normalizeStationScreenSpotPrefix(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.length > 20 || !spotPrefixPattern.test(trimmed)) return null;
  return trimmed;
}

function spotMatchesScreenPrefix(spot: ScreenSpotInput, spotPrefix: string): boolean {
  if (isMainHallPrefix(spotPrefix)) {
    return spot.type === "TABLE" && /^[0-9]+$/.test(spot.label.trim());
  }
  if (spot.type !== "TABLE") return false;
  return tableLabelMatchesPrefix(spot.label, spotPrefix);
}

/** Limit KDS/BDS spot list to a zone when the screen has spotPrefix set. */
export function filterVenueSpotsForScreen(
  spots: ScreenSpotInput[],
  spotPrefix: string | null | undefined,
): ScreenSpotInput[] {
  const prefix = spotPrefix?.trim();
  if (!prefix) return spots;
  return spots.filter((spot) => spotMatchesScreenPrefix(spot, prefix));
}

/** True when a pass-signal location is allowed for this screen's spotPrefix. */
export function passLocationMatchesScreenSpotPrefix(
  location: PassSignalLocation,
  spotPrefix: string | null | undefined,
): boolean {
  const prefix = spotPrefix?.trim();
  if (!prefix) return true;

  if (location.sunbedNumber?.trim() || location.roomNumber?.trim()) {
    return false;
  }

  const table = location.tableNumber?.trim();
  if (!table) return false;

  return spotMatchesScreenPrefix({ type: "TABLE", label: table }, prefix);
}
