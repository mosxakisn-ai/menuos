const STORAGE_PREFIX = "menuos-staff-setup-verified:v1:";

function storageKey(venueId: string): string {
  return `${STORAGE_PREFIX}${venueId.trim()}`;
}

export function readStaffSetupVerified(venueId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey(venueId)) === "1";
  } catch {
    return false;
  }
}

export function writeStaffSetupVerified(venueId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(venueId), "1");
  } catch {
    /* private mode / quota */
  }
}

export function clearStaffSetupVerified(venueId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(venueId));
  } catch {
    /* ignore */
  }
}
