import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { organizationIdFromPhotoKey, verifyPhotoSignature } from "@/lib/photo-signing";
import { resolvePhotoFilePath } from "@/lib/photo-storage";

type Params = { params: Promise<{ path: string[] }> };

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
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
