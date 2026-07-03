import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { organizationIdFromPhotoKey, verifyPhotoSignature } from "@/lib/photo-signing";
import { resolvePhotoFilePath } from "@/lib/photo-storage";

type Params = { params: Promise<{ path: string[] }> };

function parseResizeWidth(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get("w")?.trim();
  if (!raw) return null;
  const w = Number.parseInt(raw, 10);
  if (!Number.isFinite(w) || w < 1 || w > 800) return null;
  return w;
}

export async function GET(request: Request, { params }: Params) {
  const { path: segments } = await params;
  if (!segments?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = segments.map((s) => decodeURIComponent(s)).join("/");
  const filePath = resolvePhotoFilePath(key);
  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sig = new URL(request.url).searchParams.get("sig")?.trim() ?? "";
  let allowed = verifyPhotoSignature(key, sig);
  if (!allowed) {
    const session = await getSession();
    const orgId = organizationIdFromPhotoKey(key);
    if (session && orgId && session.organizationId === orgId) {
      allowed = true;
    }
  }
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await fs.readFile(filePath);
    const resizeWidth = parseResizeWidth(request);
    if (resizeWidth) {
      const resized = await sharp(data)
        .resize(resizeWidth, resizeWidth, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      return new NextResponse(new Uint8Array(resized), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
