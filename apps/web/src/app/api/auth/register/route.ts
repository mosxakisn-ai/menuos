import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma, UserRole } from "@menuos/db";
import { registerSchema, computeTrialEndsAt } from "@menuos/shared";
import { fireAdminNotify, notifyAdminOrganizationRegistered } from "@/lib/admin-notify";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import {
  consumeRegistrationOtp,
  normalizeRegistrationEmail,
  verifyRegistrationOtp,
} from "@/lib/registration-otp";
import { slugifyOrFallback } from "@/lib/utils";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, businessName, otp } = parsed.data;
  const normalizedEmail = normalizeRegistrationEmail(email);

  const ip = clientIp(request);
  if (!(await checkRateLimit(`register:ip:${ip}`, 20, 60 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  const otpCheck = await verifyRegistrationOtp(normalizedEmail, otp);
  if (!otpCheck.ok) {
    return NextResponse.json({ error: otpCheck.error, code: otpCheck.code }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Αυτό το email είναι ήδη εγγεγραμμένο.", code: "email_taken" }, { status: 409 });
  }

  await consumeRegistrationOtp(normalizedEmail);

  let orgSlug = slugifyOrFallback(businessName, "org");
  const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (slugTaken) {
    orgSlug = `${orgSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const trialEndsAt = computeTrialEndsAt();

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
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json({ error: "Email or organization already exists" }, { status: 409 });
    }
    throw err;
  }
}
