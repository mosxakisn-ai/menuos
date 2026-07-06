import type { VenueSpotType } from "./venue-spots";

export type ScreenSpotInput = { type: VenueSpotType; label: string };

export type PassSignalLocation = {
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
};

/** Stored in DB: show only plain numeric table labels (1, 2, 3…). */
export const MAIN_HALL_SPOT_PREFIX = "*";

/** Legacy value from older setups — still accepted when filtering. */
export const LEGACY_MAIN_HALL_SPOT_PREFIX = "Σαλόνι";

export const STATION_SCREEN_SPOT_PREFIX_PATTERN =
  /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_*-]*$/;

function prefixKey(raw: string): string {
  return raw.trim().toLocaleLowerCase("el");
}

export function isNumericTablesSpotPrefix(spotPrefix: string): boolean {
  const key = prefixKey(spotPrefix);
  return (
    key === prefixKey(MAIN_HALL_SPOT_PREFIX) || key === prefixKey(LEGACY_MAIN_HALL_SPOT_PREFIX)
  );
}

function isMainHallPrefix(spotPrefix: string): boolean {
  return isNumericTablesSpotPrefix(spotPrefix);
}

function tableLabelMatchesPrefix(label: string, prefix: string): boolean {
  const key = prefixKey(label);
  const pKey = prefixKey(prefix);
  return key === pKey || key.startsWith(`${pKey}-`);
}

export function normalizeStationScreenSpotPrefix(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.length > 20 || !STATION_SCREEN_SPOT_PREFIX_PATTERN.test(trimmed)) return null;
  return trimmed;
}

function spotMatchesScreenPrefix(spot: ScreenSpotInput, spotPrefix: string): boolean {
  if (isMainHallPrefix(spotPrefix)) {
    return spot.type === "TABLE" && /^[0-9]+$/.test(spot.label.trim());
  }
  if (spot.type !== "TABLE") return false;
  return tableLabelMatchesPrefix(spot.label, spotPrefix);
}

/** KDS/BDS table filter from a pass post's space (zone id on Πόστα tab). */
export function spotPrefixForVenuePost(
  post: { zoneId?: string | null },
  zoneLabels?: Record<string, string> | undefined,
): string | null {
  const zoneId = post.zoneId?.trim();
  if (!zoneId) return null;
  if (zoneId === "main") return MAIN_HALL_SPOT_PREFIX;
  if (zoneId.startsWith("prefix:")) {
    const labelled = zoneLabels?.[zoneId]?.trim();
    if (labelled) {
      const normalized = normalizeStationScreenSpotPrefix(labelled);
      if (normalized) return normalized;
    }
    const fromId = zoneId.slice("prefix:".length);
    return normalizeStationScreenSpotPrefix(fromId);
  }
  return null;
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

