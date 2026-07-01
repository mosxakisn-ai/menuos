import { describe, expect, it, vi } from "vitest";
import { PASS_SIGNAL_RETENTION_DAYS, processPassSignalCleanup } from "./pass-signal-cleanup";

vi.mock("@menuos/db", () => ({
  prisma: {
    passSignal: {
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@menuos/db";

describe("processPassSignalCleanup", () => {
  it("deletes delivered signals older than retention window", async () => {
    vi.mocked(prisma.passSignal.deleteMany).mockResolvedValue({ count: 3 });
    const now = new Date("2026-06-01T12:00:00Z");

    const result = await processPassSignalCleanup(now);

    expect(result).toEqual({ retentionDays: PASS_SIGNAL_RETENTION_DAYS, deleted: 3 });
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
