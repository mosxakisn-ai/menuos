import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/api-auth";
import { ONBOARDING_CONFIRMED_COOKIE } from "@/lib/onboarding-constants";

/** Marks onboarding confirmation (step 4) as seen. */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_CONFIRMED_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60,
  });
  return NextResponse.json({ ok: true });
}
