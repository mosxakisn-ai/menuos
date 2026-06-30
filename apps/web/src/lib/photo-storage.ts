import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { APP_URL } from "@/lib/config";
import { getR2PublicUrl, isR2Enabled } from "@/lib/r2-config";
import { uploadToR2 } from "@/lib/r2-storage";

export function getPhotoUploadDir(): string {
  return process.env.PHOTO_UPLOAD_DIR?.trim() || path.join(process.cwd(), "data", "uploads");
}

/** Upload via R2 when configured, otherwise save on server disk. */
export function isPhotoUploadEnabled(): boolean {
  return true;
}

function publicLocalPhotoUrl(relativeKey: string): string {
  const encoded = relativeKey.split("/").map(encodeURIComponent).join("/");
  return `${APP_URL}/api/photos/serve/${encoded}`;
}

export async function saveMenuPhoto(organizationId: string, optimized: Buffer): Promise<string> {
  const key = `photos/${organizationId}/${randomUUID()}.webp`;

  if (isR2Enabled()) {
    await uploadToR2(key, optimized, "image/webp");
    return getR2PublicUrl(key);
  }

  const root = getPhotoUploadDir();
  const filePath = path.join(root, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, optimized);
  return publicLocalPhotoUrl(key);
}

export function resolvePhotoFilePath(key: string): string | null {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith("photos/") || normalized.includes("..")) return null;
  const root = path.resolve(getPhotoUploadDir());
  const resolved = path.resolve(path.join(root, normalized));
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
  return resolved;
}
