import { NextResponse } from "next/server";
import { resolveVenueByStaffSlug } from "@/lib/staff-auth";
import { STAFF_SESSION_COOKIE } from "@/lib/staff-auth-constants";
import { APP_URL } from "@/lib/config";
import { createStaffSessionToken, staffSessionCookieOptions } from "@/lib/staff-session";

export const dynamic = "force-dynamic";

/** Staff waiter link: validate key, set httpOnly session cookie, redirect to panel. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueSlug = url.searchParams.get("venueSlug")?.trim();
  const key = url.searchParams.get("key")?.trim();

  if (!venueSlug || !key) {
    return NextResponse.json({ error: "Απαιτούνται venueSlug και key." }, { status: 400 });
  }

  const venue = await resolveVenueByStaffSlug(venueSlug, key);
  if (!venue) {
    return NextResponse.json({ error: "Μη έγκυρος σύνδεσμος σερβιτόρου." }, { status: 404 });
  }

  const token = createStaffSessionToken(venue.id, key);
  const redirectTo = new URL(`/s/${venueSlug}`, APP_URL);
  const response = NextResponse.redirect(redirectTo, 302);
  response.cookies.set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions());
  return response;
}
