import { describe, expect, it } from "vitest";

import { isPrimaryStationScreen, passSignalStationScreenWhere } from "./station-screen-signals";

describe("passSignalStationScreenWhere", () => {
  it("returns empty filter when no screen id", () => {
    expect(passSignalStationScreenWhere({ stationScreenId: null, isPrimaryScreen: true })).toEqual({});
    expect(passSignalStationScreenWhere({ stationScreenId: undefined, isPrimaryScreen: false })).toEqual({});
  });

  it("primary screen includes legacy null stationScreenId", () => {
    expect(
      passSignalStationScreenWhere({ stationScreenId: "screen-a", isPrimaryScreen: true }),
    ).toEqual({
      OR: [{ stationScreenId: "screen-a" }, { stationScreenId: null }],
    });
  });

  it("secondary screen only matches its id", () => {
    expect(
      passSignalStationScreenWhere({ stationScreenId: "screen-b", isPrimaryScreen: false }),
    ).toEqual({ stationScreenId: "screen-b" });
  });
});

describe("isPrimaryStationScreen", () => {
  it("treats missing ids as primary scope", () => {
    expect(isPrimaryStationScreen(null, "primary")).toBe(true);
    expect(isPrimaryStationScreen("screen-a", null)).toBe(true);
  });

  it("matches primary id", () => {
    expect(isPrimaryStationScreen("primary", "primary")).toBe(true);
    expect(isPrimaryStationScreen("other", "primary")).toBe(false);
  });
});
