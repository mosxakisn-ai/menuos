import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { isR2Enabled } from "@/lib/r2-config";
import { organizationIdFromPhotoKey, verifyPhotoSignature } from "@/lib/photo-signing";
import { resolvePhotoFilePath } from "@/lib/photo-storage";
import { downloadFromR2 } from "@/lib/r2-storage";

type Params = { params: Promise<{ path: string[] }> };

function parseResizeWidth(request: Request): number | null {
  const raw = new URL(request.url).searchParams.get("w")?.trim();
  if (!raw) return null;
  const w = Number.parseInt(raw, 10);
  if (!Number.isFinite(w) || w < 1 || w > 800) return null;
  return w;
}

async function readPhotoBytes(key: string, filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch {
    if (isR2Enabled()) {
      return downloadFromR2(key);
    }
    return null;
  }
}

function photoContentType(data: Buffer): string {
  if (data.length >= 2 && data[0] === 0xff && data[1] === 0xd8) return "image/jpeg";
  if (data.length >= 8 && data.toString("ascii", 0, 8) === "PNG\r\n\x1a\n") return "image/png";
  return "image/webp";
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
    const data = await readPhotoBytes(key, filePath);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
        "Content-Type": photoContentType(data),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
