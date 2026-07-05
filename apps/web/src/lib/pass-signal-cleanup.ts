import { prisma } from "@menuos/db";

/** Delivered pass signals older than this are deleted (history API uses the same window max). */
export const PASS_SIGNAL_RETENTION_DAYS = 90;

/** READY / PICKED_UP signals older than this are auto-closed (delivered). */
export const PASS_SIGNAL_ACTIVE_MAX_HOURS = 5;

export type PassSignalCleanupResult = {
  retentionDays: number;
  deleted: number;
  expired: number;
};

export async function expireStaleActivePassSignals(opts?: {
  venueId?: string;
  now?: Date;
  maxHours?: number;
}): Promise<{ expired: number }> {
  const now = opts?.now ?? new Date();
  const maxHours = opts?.maxHours ?? PASS_SIGNAL_ACTIVE_MAX_HOURS;
  const cutoff = new Date(now.getTime() - maxHours * 60 * 60 * 1000);

  const result = await prisma.passSignal.updateMany({
    where: {
      status: { in: ["READY", "PICKED_UP"] },
      readyAt: { lt: cutoff },
      ...(opts?.venueId ? { venueId: opts.venueId } : {}),
    },
    data: {
      status: "DELIVERED",
      deliveredAt: now,
    },
  });

  return { expired: result.count };
}

export async function processPassSignalCleanup(
  now = new Date(),
  retentionDays = PASS_SIGNAL_RETENTION_DAYS,
): Promise<PassSignalCleanupResult> {
  const { expired } = await expireStaleActivePassSignals({ now });

  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

  const deleteResult = await prisma.passSignal.deleteMany({
    where: {
      status: "DELIVERED",
      deliveredAt: { lt: cutoff },
    },
  });

  return {
    retentionDays,
    deleted: deleteResult.count,
    expired,
  };
}
