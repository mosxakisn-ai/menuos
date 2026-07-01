import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma, UserRole } from "@menuos/db";
import { registerSchema } from "@menuos/shared";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { fireAdminNotify, notifyAdminOrganizationRegistered } from "@/lib/admin-notify";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { normalizeRegistrationEmail, verifyRegistrationOtp } from "@/lib/registration-otp";
import { slugifyOrFallback } from "@/lib/utils";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  const { name, email, password, businessName, otp } = parsed.data;
  const normalizedEmail = normalizeRegistrationEmail(email);

  const ip = clientIp(request);
  const ipLimit = await checkRateLimitOutcome(`register:ip:${ip}`, 20, 60 * 60 * 1000);
  if (ipLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (ipLimit === "limited") {
    return NextResponse.json({ code: "rate_limited" }, { status: 429 });
  }

  const emailLimit = await checkRateLimitOutcome(`register:email:${normalizedEmail}`, 10, 60 * 60 * 1000);
  if (emailLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (emailLimit === "limited") {
    return NextResponse.json({ code: "rate_limited" }, { status: 429 });
  }

  const otpCheck = await verifyRegistrationOtp(normalizedEmail, otp);
  if (!otpCheck.ok) {
    return NextResponse.json({ code: otpCheck.code }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ code: "email_taken" }, { status: 409 });
  }

  let orgSlug = slugifyOrFallback(businessName, "org");
  const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (slugTaken) {
    orgSlug = `${orgSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const trialDays = await getTrialDaysFromCatalog();
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  try {
    const organization = await prisma.organization.create({
      data: {
        name: businessName,
        slug: orgSlug,
        subscription: {
          create: {
            plan: "TRIAL",
            status: "TRIALING",
            trialEndsAt,
          },
        },
        users: {
          create: {
            name,
            email: normalizedEmail,
            passwordHash,
            role: UserRole.ADMIN,
          },
        },
      },
      include: { users: true },
    });

    const user = organization.users[0]!;
    const token = await createSessionToken({
      userId: user.id,
      organizationId: organization.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    fireAdminNotify(() =>
      notifyAdminOrganizationRegistered({
        organizationId: organization.id,
        businessName,
        ownerName: name,
        email: normalizedEmail,
        orgSlug,
      }),
    );
    fireAdminNotify(() =>
      sendWelcomeEmail({
        to: normalizedEmail,
        name,
        businessName,
        trialEndsAt,
        trialDays,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json({ code: "duplicate" }, { status: 409 });
    }
    console.error("[menuos] register create failed", err);
    return NextResponse.json({ code: "server_error" }, { status: 503 });
  }
  } catch (err) {
    console.error("[menuos] register failed", err);
    return NextResponse.json({ code: "server_error" }, { status: 503 });
  }
}
