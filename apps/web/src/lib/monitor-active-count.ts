import { prisma } from "@menuos/db";

/** Sidebar badge on Οθόνες — pending waiter calls only. */
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

  const pendingByVenue = await prisma.waiterCall.groupBy({
    by: ["venueId"],
    where: { venueId: { in: venueIds }, status: "PENDING" },
    _count: { _all: true },
  });

  const pendingCount = pendingByVenue.reduce((sum, row) => sum + row._count._all, 0);

  return { pendingCount, activeCount: pendingCount };
}
