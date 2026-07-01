const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const slug = process.argv[2];
const table = process.argv[3];
if (!slug || !table) {
  console.error("usage: node cleanup-sim-calls.cjs <venueSlug> <tableNumber>");
  process.exit(1);
}
prisma.venue
  .findUnique({ where: { slug }, select: { id: true, name: true } })
  .then(async (v) => {
    if (!v) {
      console.log("venue not found");
      process.exit(1);
    }
    const r = await prisma.waiterCall.deleteMany({
      where: { venueId: v.id, tableNumber: table, status: "PENDING" },
    });
    console.log(JSON.stringify({ venue: v.name, table, deletedPending: r.count }));
  })
  .finally(() => prisma.$disconnect());
