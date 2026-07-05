/** Broadcast when Live 360° venue data changes (settings save, staff, screens, spots). */
export const LIVE360_UPDATED_EVENT = "menuos:live360-updated";

export function notifyLive360Updated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LIVE360_UPDATED_EVENT));
}
