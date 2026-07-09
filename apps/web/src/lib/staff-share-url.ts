import type { PassStationInput } from "@menuos/shared";
import { clientShareOrigin } from "@/lib/client-share-origin";
import { stationScreenPath } from "@/lib/station-screens";

/** Kitchen/bar/cold/dessert tablet — opens /kds, /bds, etc. without dashboard login. */
export function buildStationScreenShareUrl(
  station: PassStationInput,
  venueSlug: string,
  screenToken: string,
  opts?: { allPosts?: boolean; staffKey?: string },
): string {
  const u = new URL(stationScreenPath(station), clientShareOrigin());
  u.searchParams.set("venueSlug", venueSlug);
  u.searchParams.set("key", screenToken);
  if (opts?.allPosts) u.searchParams.set("allPosts", "1");
  const staffKey = opts?.staffKey?.trim();
  if (staffKey) u.searchParams.set("staffKey", staffKey);
  return u.toString();
}

/** Shareable waiter link — opens /s/{slug} which sets session cookie and loads the panel. */
export function buildStaffShareUrl(
  venueSlug: string,
  key: string,
  zoneId?: string | null,
): string {
  const u = new URL(`/s/${encodeURIComponent(venueSlug)}`, clientShareOrigin());
  u.searchParams.set("key", key);
  const zone = zoneId?.trim();
  if (zone) u.searchParams.set("zone", zone);
  return u.toString();
}

/** Server-side absolute staff URL (QR generation, emails). */
export function buildStaffShareUrlAbsolute(
  origin: string,
  venueSlug: string,
  key: string,
  zoneId?: string | null,
): string {
  const u = new URL(`/s/${encodeURIComponent(venueSlug)}`, origin);
  u.searchParams.set("key", key);
  const zone = zoneId?.trim();
  if (zone) u.searchParams.set("zone", zone);
  return u.toString();
}
