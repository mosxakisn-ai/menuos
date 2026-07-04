import { APP_URL } from "@/lib/config";

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

/** Extract storage key from signed serve URL, legacy R2 public URL, or bare path. */
export function photoKeyFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url, APP_URL);
    const fromServe = photoStorageKeyFromPath(parsed.pathname);
    if (fromServe) return fromServe;

    const pathKey = parsed.pathname.replace(/^\/+/, "");
    if (pathKey.startsWith("photos/") && !pathKey.includes("..")) return pathKey;

    const r2Base = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
    if (r2Base) {
      const normalized = url.startsWith("http://") || url.startsWith("https://") ? url : `${APP_URL}${url}`;
      if (normalized.startsWith(`${r2Base}/`)) {
        const key = normalized.slice(r2Base.length + 1);
        if (key.startsWith("photos/") && !key.includes("..")) return key;
      }
    }

    const bare = url.replace(/^\/+/, "");
    if (bare.startsWith("photos/") && !bare.includes("..")) return bare;
    return null;
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
