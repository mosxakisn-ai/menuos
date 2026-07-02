/** Browser confirm for irreversible actions (delete, revoke link, etc.). */
export function confirmDestructive(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}

/** Same UX as destructive — used for rotate token / invalidate link warnings. */
export function confirmWarning(message: string): boolean {
  return confirmDestructive(message);
}
