import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@menuos/db";
import { requireLive360Plan } from "@/lib/api-auth";
import { APP_URL } from "@/lib/config";
import { buildStaffShareUrlAbsolute } from "@/lib/staff-share-url";

export async function GET(request: Request) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const sp = new URL(request.url).searchParams;
  const venueId = sp.get("venueId")?.trim();
  const zoneId = sp.get("zone")?.trim() || undefined;

  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizationId: auth.session!.organizationId },
    select: { slug: true, staffToken: true, primaryColor: true },
  });

  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const staffUrl = buildStaffShareUrlAbsolute(APP_URL, venue.slug, venue.staffToken, zoneId);
  const pngDataUrl = await QRCode.toDataURL(staffUrl, {
    width: 512,
    margin: 2,
    color: { dark: venue.primaryColor, light: "#FFFFFF" },
  });

  return NextResponse.json({ staffUrl, pngDataUrl });
}
