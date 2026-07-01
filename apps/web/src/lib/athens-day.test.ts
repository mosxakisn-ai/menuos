import { describe, expect, it } from "vitest";
import { startOfTodayAthens } from "./athens-day";

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
