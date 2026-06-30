import { createHmac, timingSafeEqual } from "node:crypto";
import { APP_URL } from "@/lib/config";

function photoSignSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required for photo URLs");
  }
  return secret ?? "dev-photo-signing-change-me";
}

export function photoStorageKeyFromPath(pathname: string): string | null {
  const prefix = "/api/photos/serve/";
  const idx = pathname.indexOf(prefix);
  if (idx < 0) return null;
  const encoded = pathname.slice(idx + prefix.length);
  if (!encoded) return null;
  try {
    return encoded.split("/").map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    return null;
  }
}

export function organizationIdFromPhotoKey(key: string): string | null {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = normalized.split("/");
  if (parts[0] !== "photos" || !parts[1]) return null;
  return parts[1];
}

export function signPhotoKey(key: string): string {
  return createHmac("sha256", photoSignSecret()).update(key).digest("base64url");
}

export function verifyPhotoSignature(key: string, sig: string): boolean {
  if (!sig) return false;
  const expected = signPhotoKey(key);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function signedPhotoServeUrl(relativeKey: string): string {
  const encoded = relativeKey.split("/").map(encodeURIComponent).join("/");
  const sig = signPhotoKey(relativeKey);
  return `${APP_URL}/api/photos/serve/${encoded}?sig=${encodeURIComponent(sig)}`;
}

/** Add HMAC sig to local MenuOS photo serve URLs (R2/external URLs unchanged). */
export function appendPhotoSignature(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed, APP_URL);
    const key = photoStorageKeyFromPath(parsed.pathname);
    if (!key) return trimmed;
    if (parsed.searchParams.has("sig")) return trimmed;
    parsed.searchParams.set("sig", signPhotoKey(key));
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}
