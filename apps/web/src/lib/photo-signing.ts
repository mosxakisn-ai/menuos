import { createHmac, timingSafeEqual } from "node:crypto";
import { APP_URL } from "@/lib/config";
import {
  organizationIdFromPhotoKey,
  photoKeyFromPublicUrl,
  photoStorageKeyFromPath,
} from "@/lib/photo-keys";

export {
  organizationIdFromPhotoKey,
  photoKeyFromPublicUrl,
  photoStorageKeyFromPath,
} from "@/lib/photo-keys";

function photoSignSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required for photo URLs");
  }
  return secret ?? "dev-photo-signing-change-me";
}

export function ensureSignedPhotoServeUrl(url: string): string {
  const key = photoKeyFromPublicUrl(url);
  if (!key) return url;
  return signedPhotoServeUrl(key);
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

/** Normalize MenuOS photo URLs to a signed serve URL on the current APP_URL host. */
export function normalizeStoredPhotoUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  return ensureSignedPhotoServeUrl(url.trim());
}

/** Add HMAC sig and canonical host for MenuOS photo serve URLs (R2/external URLs unchanged). */
export function appendPhotoSignature(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const key = photoKeyFromPublicUrl(trimmed);
  if (key) return signedPhotoServeUrl(key);
  return trimmed;
}
