import { prisma } from "@menuos/db";

export type MonitorActiveCounts = {
  pendingCount: number;
  activeCount: number;
  byVenue: Record<string, number>;
};

/** Sidebar badge on Οθόνες — pending waiter calls + ready pass messages. */
export async function countOrganizationMonitorActive(organizationId: string): Promise<MonitorActiveCounts> {
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    select: { id: true },
  });

  if (venues.length === 0) {
    return { pendingCount: 0, activeCount: 0, byVenue: {} };
  }

  const venueIds = venues.map((venue) => venue.id);
  const byVenue: Record<string, number> = Object.fromEntries(venueIds.map((id) => [id, 0]));

  const [pendingByVenue, readyPassByVenue] = await Promise.all([
    prisma.waiterCall.groupBy({
      by: ["venueId"],
      where: { venueId: { in: venueIds }, status: "PENDING" },
      _count: { _all: true },
    }),
    prisma.passSignal.groupBy({
      by: ["venueId"],
      where: { venueId: { in: venueIds }, status: "READY" },
      _count: { _all: true },
    }),
  ]);

  for (const row of pendingByVenue) {
    byVenue[row.venueId] = (byVenue[row.venueId] ?? 0) + row._count._all;
  }
  for (const row of readyPassByVenue) {
    byVenue[row.venueId] = (byVenue[row.venueId] ?? 0) + row._count._all;
  }

  const pendingCount = Object.values(byVenue).reduce((sum, n) => sum + n, 0);

  return { pendingCount, activeCount: pendingCount, byVenue };
}
