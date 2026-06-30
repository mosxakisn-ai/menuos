/** Edge-safe supervisor token verification (Web Crypto). Node routes use supervisor-auth.ts. */

function readEnvSecret(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function supervisorSecret(): string | undefined {
  return readEnvSecret("SUPERVISOR_SESSION_SECRET") ?? readEnvSecret("NEXTAUTH_SECRET");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64UrlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

export async function verifySupervisorTokenEdge(token: string): Promise<boolean> {
  const secret = supervisorSecret();
  if (!secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = new TextDecoder().decode(base64UrlDecode(payloadB64));
  } catch {
    return false;
  }

  const expectedSig = await hmacSha256Base64Url(secret, payload);
  if (!safeEqual(sig, expectedSig)) return false;

  const [, expStr] = payload.split(":");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return true;
}
