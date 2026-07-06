import { prisma } from "@menuos/db";

/** Sidebar badge on Οθόνες — pending waiter calls + ready pass messages. */
export async function countOrganizationMonitorActive(organizationId: string): Promise<{
  pendingCount: number;
  activeCount: number;
}> {
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    select: { id: true },
  });

  if (venues.length === 0) {
    return { pendingCount: 0, activeCount: 0 };
  }

  const venueIds = venues.map((venue) => venue.id);

  const [pendingByVenue, readyPassCount] = await Promise.all([
    prisma.waiterCall.groupBy({
      by: ["venueId"],
      where: { venueId: { in: venueIds }, status: "PENDING" },
      _count: { _all: true },
    }),
    prisma.passSignal.count({
      where: { venueId: { in: venueIds }, status: "READY" },
    }),
  ]);

  const pendingCalls = pendingByVenue.reduce((sum, row) => sum + row._count._all, 0);
  const pendingCount = pendingCalls + readyPassCount;

  return { pendingCount, activeCount: pendingCount };
}
