/**
 * Set subscription period end (PRO/ACTIVE) for a customer by admin email.
 * Usage: SET_PERIOD_EMAIL=x@y.com SET_PERIOD_END=2030-12-31 node scripts/set-subscription-period-end.mjs
 */
import { PrismaClient } from "@prisma/client";

const email = (process.env.SET_PERIOD_EMAIL ?? process.argv[2] ?? "").trim().toLowerCase();
const endRaw = (process.env.SET_PERIOD_END ?? process.argv[3] ?? "").trim();
const plan = (process.env.SET_PERIOD_PLAN ?? "PRO").trim().toUpperCase();

if (!email || !endRaw) {
  console.error(
    "Usage: SET_PERIOD_EMAIL=user@example.com SET_PERIOD_END=2030-12-31 node scripts/set-subscription-period-end.mjs",
  );
  process.exit(1);
}

const periodEnd = new Date(`${endRaw}T23:59:59.999Z`);
if (!Number.isFinite(periodEnd.getTime())) {
  console.error("Invalid SET_PERIOD_END — use YYYY-MM-DD");
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

  const subscription = await prisma.subscription.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      plan,
      status: "ACTIVE",
      trialEndsAt: null,
      currentPeriodEnd: periodEnd,
    },
    update: {
      plan,
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
    }),
  );
} finally {
  await prisma.$disconnect();
}
