import { describe, expect, it } from "vitest";
import {
  kdsPassDeliveryStatus,
  PASS_SIGNAL_STALE_WARNING_SECONDS,
} from "./pass-signal-delivery";

const now = Date.parse("2026-07-09T12:00:00.000Z");

function base(overrides: Partial<Parameters<typeof kdsPassDeliveryStatus>[0]> = {}) {
  return {
    status: "READY" as const,
    readyAt: new Date(now - 30_000).toISOString(),
    ...overrides,
  };
}

describe("kdsPassDeliveryStatus", () => {
  it("shows picked up with staff name", () => {
    const result = kdsPassDeliveryStatus(
      base({
        status: "PICKED_UP",
        pickedUpByStaffMemberName: "Μάρκος",
      }),
      now,
    );
    expect(result.label).toContain("Αναγνωρίστηκε");
    expect(result.label).toContain("Μάρκος");
    expect(result.tone).toBe("picked");
  });

  it("shows seen when firstSeenAt is set", () => {
    const result = kdsPassDeliveryStatus(
      base({
        firstSeenAt: new Date(now - 10_000).toISOString(),
        seenByStaffMemberName: "Άννα",
      }),
      now,
    );
    expect(result.label).toContain("Εμφανίστηκε");
    expect(result.tone).toBe("seen");
  });

  it("warns when stale without seen", () => {
    const result = kdsPassDeliveryStatus(
      base({
        readyAt: new Date(now - (PASS_SIGNAL_STALE_WARNING_SECONDS + 5) * 1000).toISOString(),
        pushTargetCount: 2,
        pushSentCount: 2,
        pushFailedCount: 0,
      }),
      now,
    );
    expect(result.label).toContain("δεν απαντήθηκε");
    expect(result.tone).toBe("danger");
  });

  it("shows push failure", () => {
    const result = kdsPassDeliveryStatus(
      base({
        pushTargetCount: 2,
        pushSentCount: 0,
        pushFailedCount: 2,
      }),
      now,
    );
    expect(result.label).toBe("Δεν παραδόθηκε");
    expect(result.tone).toBe("danger");
  });
});
