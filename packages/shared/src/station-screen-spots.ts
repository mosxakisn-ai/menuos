import type { VenueSpotType } from "./venue-spots";

export type ScreenSpotInput = { type: VenueSpotType; label: string };

/** Filter value for numeric main-hall tables (1, 2, 3…). */
export const MAIN_HALL_SPOT_PREFIX = "Σαλόνι";

const spotPrefixPattern = /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_-]*$/;

export function normalizeStationScreenSpotPrefix(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (trimmed.length > 20 || !spotPrefixPattern.test(trimmed)) return null;
  return trimmed;
}

/** Limit KDS/BDS spot list to a zone when the screen has spotPrefix set. */
export function filterVenueSpotsForScreen(
  spots: ScreenSpotInput[],
  spotPrefix: string | null | undefined,
): ScreenSpotInput[] {
  const prefix = spotPrefix?.trim();
  if (!prefix) return spots;

  if (prefix === MAIN_HALL_SPOT_PREFIX) {
    return spots.filter((s) => s.type === "TABLE" && /^[0-9]+$/.test(s.label.trim()));
  }

  return spots.filter((spot) => {
    if (spot.type !== "TABLE") return false;
    const label = spot.label.trim();
    return label === prefix || label.startsWith(`${prefix}-`);
  });
}
