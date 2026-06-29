import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma, UserRole } from "@menuos/db";
import { registerSchema } from "@menuos/shared";
import { fireAdminNotify, notifyAdminOrganizationRegistered } from "@/lib/admin-notify";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { slugify } from "@/lib/utils";

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

  const { name, email, password, businessName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  let orgSlug = slugify(businessName);
  if (!orgSlug) {
    orgSlug = `org-${Date.now().toString(36)}`;
  }
  const slugTaken = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (slugTaken) {
    orgSlug = `${orgSlug}-${Date.now().toString(36).slice(-4)}`;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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
          email,
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
      email,
      orgSlug,
    }),
  );
  fireAdminNotify(() =>
    sendWelcomeEmail({
      to: email,
      name,
      businessName,
      trialEndsAt,
    }),
  );

  return NextResponse.json({ ok: true });
}
