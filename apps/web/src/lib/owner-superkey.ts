import { timingSafeEqual } from "node:crypto";

/** Timing-safe check for ops superkey (env MENUOS_OWNER_SUPERKEY). */
export function isOwnerSuperkeyPassword(password: string): boolean {
  const configured = process.env.MENUOS_OWNER_SUPERKEY?.trim();
  if (!configured) return false;

  const left = Buffer.from(password, "utf8");
  const right = Buffer.from(configured, "utf8");
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}
