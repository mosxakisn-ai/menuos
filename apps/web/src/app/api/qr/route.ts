import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireActiveSubscription } from "@/lib/api-auth";
import { APP_URL } from "@/lib/config";
import { getVenueForOrganization } from "@/lib/venue-access";

export async function GET(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const sp = new URL(request.url).searchParams;
  const venueId = sp.get("venueId");
  const table = sp.get("table") ?? "";
  const room = sp.get("room") ?? "";
  const lang = sp.get("lang") === "en" ? "en" : "gr";

  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const params = new URLSearchParams();
  if (lang === "en") params.set("lang", "en");
  if (table) params.set("table", table);
  if (room) params.set("room", room);
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
