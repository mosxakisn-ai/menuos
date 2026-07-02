import { clientShareOrigin } from "@/lib/client-share-origin";

/** Shareable waiter link — opens /s/{slug} which sets session cookie and loads the panel. */
export function buildStaffShareUrl(venueSlug: string, key: string): string {
  const u = new URL(`/s/${encodeURIComponent(venueSlug)}`, clientShareOrigin());
  u.searchParams.set("key", key);
  return u.toString();
}
