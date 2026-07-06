import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import {
  ONBOARDING_CONFIRMED_COOKIE,
  ONBOARDING_COOKIE_BASE,
  ONBOARDING_COOKIE_MAX_AGE,
  ONBOARDING_QR_COOKIE,
} from "@/lib/onboarding-constants";

/** Marks onboarding confirmation (step 4) — persist in DB + cookies so the wizard never reappears. */
export async function POST() {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const now = new Date();
  const orgId = auth.session!.organizationId;

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      onboardingConfirmedAt: now,
      onboardingQrAcknowledgedAt: now,
    },
  });

  const cookieStore = await cookies();
  const permanent = { ...ONBOARDING_COOKIE_BASE, maxAge: ONBOARDING_COOKIE_MAX_AGE };

  cookieStore.set(ONBOARDING_CONFIRMED_COOKIE, "1", permanent);
  cookieStore.set(ONBOARDING_QR_COOKIE, "1", permanent);

  return NextResponse.json({ ok: true });
}
