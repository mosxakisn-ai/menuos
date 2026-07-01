import { prisma } from "@menuos/db";

/** Delivered pass signals older than this are deleted (history API uses the same window max). */
export const PASS_SIGNAL_RETENTION_DAYS = 90;

export type PassSignalCleanupResult = {
  retentionDays: number;
  deleted: number;
};

export async function processPassSignalCleanup(
  now = new Date(),
  retentionDays = PASS_SIGNAL_RETENTION_DAYS,
): Promise<PassSignalCleanupResult> {
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
  };
}
