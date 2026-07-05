import { clientShareOrigin } from "@/lib/client-share-origin";

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
