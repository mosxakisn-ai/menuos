import { prisma } from "@menuos/db";
import { normalizeVenueOperationsConfig, passStationInputToDb } from "@menuos/shared";

type DbPassStation = "KITCHEN" | "BAR" | "COLD" | "DESSERT";

function enabledPassStationsForVenue(
  operationsConfig: unknown,
): readonly DbPassStation[] {
  const config = normalizeVenueOperationsConfig(operationsConfig ?? null);
  return config.enabledStations.map(passStationInputToDb);
}

/** Matches waiter panel badge logic: pending calls + pass on enabled stations only. */
export async function countOrganizationMonitorActive(organizationId: string): Promise<{
  pendingCount: number;
  passCount: number;
  activeCount: number;
}> {
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    select: {
      id: true,
      settings: { select: { operationsConfig: true } },
    },
  });

  if (venues.length === 0) {
    return { pendingCount: 0, passCount: 0, activeCount: 0 };
  }

  const venueIds = venues.map((venue) => venue.id);
  const enabledByVenue = new Map(
    venues.map((venue) => [
      venue.id,
      enabledPassStationsForVenue(venue.settings?.operationsConfig ?? null),
    ]),
  );

  const [pendingByVenue, passes] = await Promise.all([
    prisma.waiterCall.groupBy({
      by: ["venueId"],
      where: { venueId: { in: venueIds }, status: "PENDING" },
      _count: { _all: true },
    }),
    prisma.passSignal.findMany({
      where: {
        venueId: { in: venueIds },
        status: { in: ["READY", "PICKED_UP"] },
      },
      select: { venueId: true, station: true },
    }),
  ]);

  const pendingCount = pendingByVenue.reduce((sum, row) => sum + row._count._all, 0);

  let passCount = 0;
  for (const pass of passes) {
    const enabled = enabledByVenue.get(pass.venueId) ?? [];
    if (enabled.includes(pass.station as DbPassStation)) passCount += 1;
  }

  return { pendingCount, passCount, activeCount: pendingCount + passCount };
}
