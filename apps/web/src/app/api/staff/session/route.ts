import { NextResponse } from "next/server";
import { resolveStaffAuthBySlug } from "@/lib/staff-auth";
import { STAFF_SESSION_COOKIE } from "@/lib/staff-auth-constants";
import { getOrganizationPlanContext, organizationCanUseLive360 } from "@/lib/billing";
import { resolvePublicOrigin } from "@/lib/public-app-origin";
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

  const auth = await resolveStaffAuthBySlug(venueSlug, key);
  if (!auth) {
    return NextResponse.json({ error: "Μη έγκυρος σύνδεσμος σερβιτόρου." }, { status: 404 });
  }

  const plan = await getOrganizationPlanContext(auth.venue.organizationId);
  if (!plan?.active) {
    return NextResponse.json(
      { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
      { status: 403 },
    );
  }
  if (!organizationCanUseLive360(plan.planId)) {
    return NextResponse.json(
      { error: "Το Live 360° είναι διαθέσιμο στο πλάνο Pro.", code: "pro_required" },
      { status: 403 },
    );
  }

  const token = createStaffSessionToken(auth.venue.id, key);
  const redirectTo = new URL(`/s/${venueSlug}`, resolvePublicOrigin(request));
  const response = NextResponse.redirect(redirectTo, 302);
  response.cookies.set(STAFF_SESSION_COOKIE, token, staffSessionCookieOptions());
  return response;
}
