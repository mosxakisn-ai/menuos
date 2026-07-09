import { NextResponse } from "next/server";
import { buildStaffPwaManifest } from "@/lib/staff-pwa-manifest";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ venueSlug: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { venueSlug } = await params;
  const manifest = buildStaffPwaManifest(venueSlug);

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
