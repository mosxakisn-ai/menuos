import { describe, expect, it, vi } from "vitest";
import {
  PASS_SIGNAL_ACTIVE_MAX_HOURS,
  PASS_SIGNAL_RETENTION_DAYS,
  expireStaleActivePassSignals,
  processPassSignalCleanup,
} from "./pass-signal-cleanup";

vi.mock("@menuos/db", () => ({
  prisma: {
    passSignal: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@menuos/db";

describe("expireStaleActivePassSignals", () => {
  it("auto-delivers READY/PICKED_UP signals older than max hours", async () => {
    vi.mocked(prisma.passSignal.updateMany).mockResolvedValue({ count: 2 });
    const now = new Date("2026-06-01T12:00:00Z");

    const result = await expireStaleActivePassSignals({ now, venueId: "v1" });

    expect(result).toEqual({ expired: 2 });
    expect(prisma.passSignal.updateMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["READY", "PICKED_UP"] },
        readyAt: {
          lt: new Date(now.getTime() - PASS_SIGNAL_ACTIVE_MAX_HOURS * 60 * 60 * 1000),
        },
        venueId: "v1",
      },
      data: {
        status: "DELIVERED",
        deliveredAt: now,
      },
    });
  });
});

describe("processPassSignalCleanup", () => {
  it("expires stale active signals then deletes old delivered rows", async () => {
    vi.mocked(prisma.passSignal.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.passSignal.deleteMany).mockResolvedValue({ count: 3 });
    const now = new Date("2026-06-01T12:00:00Z");

    const result = await processPassSignalCleanup(now);

    expect(result).toEqual({
      retentionDays: PASS_SIGNAL_RETENTION_DAYS,
      deleted: 3,
      expired: 1,
    });
    expect(prisma.passSignal.deleteMany).toHaveBeenCalledWith({
      where: {
        status: "DELIVERED",
        deliveredAt: {
          lt: new Date(now.getTime() - PASS_SIGNAL_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        },
      },
    });
  });
});
