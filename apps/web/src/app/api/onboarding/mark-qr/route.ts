import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import {
  ONBOARDING_COOKIE_BASE,
  ONBOARDING_COOKIE_MAX_AGE,
  ONBOARDING_QR_COOKIE,
} from "@/lib/onboarding-constants";

/** Marks QR step (step 3) — persist in DB + long-lived cookie. */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const orgId = auth.session!.organizationId;
  const now = new Date();

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      onboardingQrAcknowledgedAt: now,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_QR_COOKIE, "1", {
    ...ONBOARDING_COOKIE_BASE,
    maxAge: ONBOARDING_COOKIE_MAX_AGE,
  });
  return NextResponse.json({ ok: true });
}
