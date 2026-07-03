import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { parseQrMenuLanguage } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { APP_URL } from "@/lib/config";
import { getVenueForOrganization } from "@/lib/venue-access";

const MAX_LOCATION_LEN = 20;

export async function GET(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const sp = new URL(request.url).searchParams;
  const venueId = sp.get("venueId");
  const table = (sp.get("table") ?? "").slice(0, MAX_LOCATION_LEN);
  const room = (sp.get("room") ?? "").slice(0, MAX_LOCATION_LEN);
  const sunbed = (sp.get("sunbed") ?? "").slice(0, MAX_LOCATION_LEN);
  const lang = parseQrMenuLanguage(sp.get("lang"));

  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const params = new URLSearchParams();
  if (lang !== "GR") params.set("lang", lang.toLowerCase());
  if (table) params.set("table", table);
  if (room) params.set("room", room);
  if (sunbed) params.set("sunbed", sunbed);
  const qs = params.toString();
  const menuUrl = `${APP_URL}/m/${venue.slug}${qs ? `?${qs}` : ""}`;

  const pngDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 512,
    margin: 2,
    color: { dark: venue.primaryColor, light: "#FFFFFF" },
  });

  return NextResponse.json({
    menuUrl,
    pngDataUrl,
    venue: { id: venue.id, name: venue.name, slug: venue.slug },
  });
}
