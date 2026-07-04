import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/api-auth";
import { ONBOARDING_CONFIRMED_COOKIE, ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";

const onboardingCookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** Marks onboarding confirmation (step 4) — only then persist QR + unlock the panel. */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const cookieStore = await cookies();
  const permanent = { ...onboardingCookieBase, maxAge: 365 * 24 * 60 * 60 };

  cookieStore.set(ONBOARDING_CONFIRMED_COOKIE, "1", permanent);
  cookieStore.set(ONBOARDING_QR_COOKIE, "1", permanent);

  return NextResponse.json({ ok: true });
}
