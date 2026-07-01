import { prisma } from "@menuos/db";
import { DEMO_VENUE_SLUG } from "@menuos/shared";

/** Orphan PENDING calls on the public demo venue. */
export const DEMO_PENDING_CANCEL_MINUTES = 15;
/** Full waiter-call history wipe for demo venue. */
export const DEMO_CALLS_DELETE_MINUTES = 30;

export type DemoCleanupResult = {
  venueId: string | null;
  canceledPending: number;
  deleted: number;
};

export async function processDemoVenueCleanup(now = new Date()): Promise<DemoCleanupResult> {
  const pauseUntilRaw = process.env.DEMO_SHOWCASE_UNTIL?.trim();
  if (pauseUntilRaw) {
    const pauseUntil = new Date(pauseUntilRaw);
    if (!Number.isNaN(pauseUntil.getTime()) && pauseUntil > now) {
      const venue = await prisma.venue.findUnique({
        where: { slug: DEMO_VENUE_SLUG },
        select: { id: true },
      });
      return { venueId: venue?.id ?? null, canceledPending: 0, deleted: 0 };
    }
  }

  const venue = await prisma.venue.findUnique({
    where: { slug: DEMO_VENUE_SLUG },
    select: { id: true },
  });

  if (!venue) {
    return { venueId: null, canceledPending: 0, deleted: 0 };
  }

  const pendingCutoff = new Date(now.getTime() - DEMO_PENDING_CANCEL_MINUTES * 60_000);
  const deleteCutoff = new Date(now.getTime() - DEMO_CALLS_DELETE_MINUTES * 60_000);

  const cancelResult = await prisma.waiterCall.updateMany({
    where: {
      venueId: venue.id,
      status: "PENDING",
      createdAt: { lt: pendingCutoff },
    },
    data: { status: "CANCELED" },
  });

  const deleteResult = await prisma.waiterCall.deleteMany({
    where: {
      venueId: venue.id,
      createdAt: { lt: deleteCutoff },
    },
  });

  return {
    venueId: venue.id,
    canceledPending: cancelResult.count,
    deleted: deleteResult.count,
  };
}
