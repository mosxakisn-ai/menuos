import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SUPERVISOR_COOKIE } from "@/lib/supervisor-auth-constants";
import {
  findSupervisorOperatorByUsername,
  isSupervisorOperatorSessionAllowed,
} from "@/lib/supervisor-operator-service";
import bcrypt from "bcryptjs";

export { SUPERVISOR_COOKIE } from "@/lib/supervisor-auth-constants";
const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function readEnvSecret(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function supervisorSecret(): string {
  const secret =
    readEnvSecret("SUPERVISOR_SESSION_SECRET") ?? readEnvSecret("NEXTAUTH_SECRET");
  if (!secret) {
    throw new Error("SUPERVISOR_SESSION_SECRET or NEXTAUTH_SECRET is required");
  }
  return secret;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function verifyEnvSupervisorCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.SUPERVISOR_USERNAME?.trim().toLowerCase();
  const expectedPass = process.env.SUPERVISOR_PASSWORD ?? "";
  if (!expectedUser || !expectedPass) return false;
  return (
    safeEqual(username.trim().toLowerCase(), expectedUser) && safeEqual(password, expectedPass)
  );
}

export async function verifySupervisorCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed || !password) return false;

  try {
    const row = await findSupervisorOperatorByUsername(trimmed);
    if (row) {
      if (!row.active) return false;
      return bcrypt.compare(password, row.passwordHash);
    }
  } catch {
    return verifyEnvSupervisorCredentials(trimmed, password);
  }

  return verifyEnvSupervisorCredentials(trimmed, password);
}

export function createSupervisorToken(username: string): string {
  const normalized = username.trim().toLowerCase();
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${normalized}:${exp}`;
  const sig = createHmac("sha256", supervisorSecret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifySupervisorToken(token: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const expectedSig = createHmac("sha256", supervisorSecret()).update(payload).digest("base64url");
  if (!safeEqual(sig, expectedSig)) return false;

  const [, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}

export async function getSupervisorSession(): Promise<{ username: string } | null> {
  const token = (await cookies()).get(SUPERVISOR_COOKIE)?.value;
  if (!token || !verifySupervisorToken(token)) return null;

  const payloadB64 = token.split(".")[0]!;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const username = payload.split(":")[0]!;

  try {
    if (!(await isSupervisorOperatorSessionAllowed(username))) return null;
  } catch {
    // DB unavailable — keep env-only sessions working
  }

  return { username };
}

export function supervisorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: TOKEN_TTL_MS / 1000,
  };
}
