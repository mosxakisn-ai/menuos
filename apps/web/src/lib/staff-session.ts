import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { STAFF_SESSION_COOKIE, STAFF_SESSION_TTL_MS } from "@/lib/staff-auth-constants";

export type StaffSessionPayload = {
  venueId: string;
  staffToken: string;
};

function staffSessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for staff sessions");
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createStaffSessionToken(venueId: string, staffToken: string): string {
  const exp = Date.now() + STAFF_SESSION_TTL_MS;
  const payload = `${venueId}:${staffToken}:${exp}`;
  const sig = createHmac("sha256", staffSessionSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyStaffSessionToken(token: string): StaffSessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expectedSig = createHmac("sha256", staffSessionSecret())
    .update(payload)
    .digest("base64url");
  if (!safeEqual(sig, expectedSig)) return null;

  const [venueId, staffToken, expStr] = payload.split(":");
  if (!venueId || !staffToken) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  return { venueId, staffToken };
}

export function staffSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: STAFF_SESSION_TTL_MS / 1000,
  };
}

export async function readStaffSessionFromCookies(): Promise<StaffSessionPayload | null> {
  const token = (await cookies()).get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyStaffSessionToken(token);
}

export async function setStaffSessionCookie(venueId: string, staffToken: string): Promise<void> {
  const token = createStaffSessionToken(venueId, staffToken);
  (await cookies()).set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions());
}
