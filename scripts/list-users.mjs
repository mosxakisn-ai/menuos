import { PrismaClient } from "@prisma/client";

const q = (process.argv[2] ?? "").trim().toLowerCase();
const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
    select: { email: true, name: true, role: true, organization: { select: { name: true } } },
    orderBy: { email: "asc" },
    take: 50,
  });
  console.log(JSON.stringify(users, null, 2));
} finally {
  await prisma.$disconnect();
}
