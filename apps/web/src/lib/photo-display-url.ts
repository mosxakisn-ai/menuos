import { photoKeyFromPublicUrl } from "@/lib/photo-keys";

/** Client-safe panel preview URL — session auth on serve route, no HMAC needed. */
export function panelPhotoDisplayUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const key = photoKeyFromPublicUrl(trimmed);
  if (!key) return trimmed;
  if (typeof window === "undefined") return trimmed;
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${window.location.origin}/api/photos/serve/${encoded}`;
}
