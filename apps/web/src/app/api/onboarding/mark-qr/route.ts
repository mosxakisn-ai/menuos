import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/api-auth";
import { ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";

/** Sets the httpOnly QR onboarding cookie (replaces legacy localStorage-only tracking). */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_QR_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true });
}
