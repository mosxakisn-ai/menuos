import { describe, expect, it } from "vitest";
import { getTrialPeriodDays } from "./trial";

describe("getTrialPeriodDays", () => {
  it("counts calendar days between start and end", () => {
    const startedAt = new Date("2026-01-01T12:00:00Z");
    const trialEndsAt = new Date("2026-01-08T12:00:00Z");
    expect(getTrialPeriodDays(trialEndsAt, startedAt)).toBe(7);
  });

  it("returns at least 1 day for same-day end", () => {
    const t = new Date("2026-06-01T10:00:00Z");
    expect(getTrialPeriodDays(t, t)).toBe(1);
  });
});
