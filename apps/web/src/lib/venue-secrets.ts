const VENUE_SECRET_FIELDS = [
  "staffToken",
  "kitchenScreenToken",
  "barScreenToken",
  "coldScreenToken",
  "dessertScreenToken",
] as const;

export function stripVenueSecrets<T extends Record<string, unknown>>(
  venue: T,
  includeSecrets: boolean,
): Omit<T, (typeof VENUE_SECRET_FIELDS)[number]> {
  if (includeSecrets) return venue;
  const copy = { ...venue };
  for (const key of VENUE_SECRET_FIELDS) {
    delete copy[key];
  }
  return copy as Omit<T, (typeof VENUE_SECRET_FIELDS)[number]>;
}

export function stripVenuesSecrets<T extends Record<string, unknown>>(
  venues: T[],
  includeSecrets: boolean,
): Array<Omit<T, (typeof VENUE_SECRET_FIELDS)[number]>> {
  return venues.map((venue) => stripVenueSecrets(venue, includeSecrets));
}
