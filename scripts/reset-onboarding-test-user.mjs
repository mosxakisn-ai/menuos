const { PrismaClient } = require("@prisma/client");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node reset-onboarding-test-user.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      organizationId: true,
      organization: { select: { name: true } },
    },
  });

  if (!user) {
    console.log(JSON.stringify({ error: "user not found", email }));
    process.exit(1);
  }

  const venues = await prisma.venue.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, name: true, slug: true, createdAt: true },
  });

  const del = await prisma.venue.deleteMany({
    where: { organizationId: user.organizationId },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        organization: user.organization.name,
        deletedVenues: del.count,
        removed: venues,
        note: "Clear browser cookies menuos-onboarding-qr and menuos-onboarding-confirmed, or POST /api/onboarding/reset while logged in.",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
