import { describe, expect, it } from "vitest";
import { athensDayBounds, athensTodayYmd, isAthensDateInPeriod, startOfAthensDay, startOfTodayAthens } from "./athens-day";

describe("startOfTodayAthens", () => {
  it("returns a Date before noon Athens on the same calendar day", () => {
    const now = new Date("2026-07-01T10:00:00.000Z");
    const start = startOfTodayAthens(now);
    expect(start.getTime()).toBeLessThan(now.getTime());
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Athens",
        hour: "numeric",
        hour12: false,
      }).format(start),
    );
    expect(hour).toBe(0);
  });
});

describe("startOfAthensDay", () => {
  it("bounds a full Athens calendar day", () => {
    const { gte, lt } = athensDayBounds("2026-07-09");
    expect(lt.getTime() - gte.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(gte),
    ).toBe("2026-07-09");
    expect(startOfAthensDay("2026-07-09").getTime()).toBe(gte.getTime());
  });

  it("formats today in Athens as YYYY-MM-DD", () => {
    expect(athensTodayYmd(new Date("2026-07-09T12:00:00.000Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("checks calendar period membership", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    expect(isAthensDateInPeriod("2026-07-09", 7, now)).toBe(true);
    expect(isAthensDateInPeriod("2026-07-03", 7, now)).toBe(true);
    expect(isAthensDateInPeriod("2026-07-02", 7, now)).toBe(false);
  });
});
