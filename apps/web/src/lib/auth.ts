import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@menuos/db";
import { SESSION_COOKIE, APP_URL } from "@/lib/config";

let secretCache: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (secretCache) return secretCache;
  const raw = process.env.NEXTAUTH_SECRET?.trim();
  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production");
  }
  secretCache = new TextEncoder().encode(raw ?? "dev-secret-change-in-production-min-32");
  return secretCache;
}

export type SessionPayload = {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId || !payload.organizationId) return null;

  const { prisma } = await import("@menuos/db");
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, organizationId: true, email: true, name: true, role: true },
  });
  if (!user || user.organizationId !== payload.organizationId) return null;

  return {
    userId: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export { APP_URL };
