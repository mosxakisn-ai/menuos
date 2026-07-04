import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { requireSession } from "@/lib/api-auth";
import { ONBOARDING_CONFIRMED_COOKIE, ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";

const clearCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 0,
};

/** Wipe venues + onboarding cookies so the owner can retry from step 1. */
export async function POST() {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const deleted = await prisma.venue.deleteMany({
    where: { organizationId: auth.session!.organizationId },
  });

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_QR_COOKIE, "", clearCookie);
  cookieStore.set(ONBOARDING_CONFIRMED_COOKIE, "", clearCookie);

  return NextResponse.json({ ok: true, deletedVenues: deleted.count });
}
