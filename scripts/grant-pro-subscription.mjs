/**
 * Grant PRO subscription for N months (default 12).
 * Usage: GRANT_PRO_EMAIL=user@example.com node scripts/grant-pro-subscription.mjs
 */
import { PrismaClient } from "@prisma/client";

const email = (process.env.GRANT_PRO_EMAIL ?? process.argv[2] ?? "").trim().toLowerCase();
const months = Number(process.env.GRANT_PRO_MONTHS ?? "12");

if (!email) {
  console.error("Usage: GRANT_PRO_EMAIL=user@example.com node scripts/grant-pro-subscription.mjs");
  process.exit(1);
}
if (!Number.isFinite(months) || months < 1 || months > 60) {
  console.error("GRANT_PRO_MONTHS must be between 1 and 60");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { include: { subscription: true } } },
  });

  if (!user) {
    console.error(JSON.stringify({ ok: false, error: "user_not_found", email }));
    process.exit(1);
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const subscription = await prisma.subscription.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      plan: "PRO",
      status: "ACTIVE",
      trialEndsAt: null,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan: "PRO",
      status: "ACTIVE",
      trialEndsAt: null,
      currentPeriodEnd: periodEnd,
    },
  });

  console.log(
    JSON.stringify({
      ok: true,
      email,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      months,
    }),
  );
} finally {
  await prisma.$disconnect();
}
