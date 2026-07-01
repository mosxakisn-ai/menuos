import { describe, expect, it } from "vitest";
import {
  filterVenueSpotsForScreen,
  MAIN_HALL_SPOT_PREFIX,
  normalizeStationScreenSpotPrefix,
} from "./station-screen-spots";

const spots = [
  { type: "TABLE" as const, label: "1" },
  { type: "TABLE" as const, label: "12" },
  { type: "TABLE" as const, label: "Αυλή-1" },
  { type: "TABLE" as const, label: "Αυλή-2" },
  { type: "TABLE" as const, label: "Όροφος-3" },
  { type: "SUNBED" as const, label: "A1" },
  { type: "ROOM" as const, label: "101" },
];

describe("normalizeStationScreenSpotPrefix", () => {
  it("trims and accepts Greek labels", () => {
    expect(normalizeStationScreenSpotPrefix("  Αυλή  ")).toBe("Αυλή");
  });

  it("returns null for empty or invalid", () => {
    expect(normalizeStationScreenSpotPrefix("")).toBeNull();
    expect(normalizeStationScreenSpotPrefix("   ")).toBeNull();
    expect(normalizeStationScreenSpotPrefix("a".repeat(21))).toBeNull();
    expect(normalizeStationScreenSpotPrefix("table 1")).toBeNull();
  });
});

describe("filterVenueSpotsForScreen", () => {
  it("returns all spots when prefix is unset", () => {
    expect(filterVenueSpotsForScreen(spots, null)).toEqual(spots);
    expect(filterVenueSpotsForScreen(spots, undefined)).toEqual(spots);
    expect(filterVenueSpotsForScreen(spots, "")).toEqual(spots);
  });

  it("filters prefixed outdoor tables", () => {
    expect(filterVenueSpotsForScreen(spots, "Αυλή")).toEqual([
      { type: "TABLE", label: "Αυλή-1" },
      { type: "TABLE", label: "Αυλή-2" },
    ]);
  });

  it("filters main hall to numeric tables only", () => {
    expect(filterVenueSpotsForScreen(spots, MAIN_HALL_SPOT_PREFIX)).toEqual([
      { type: "TABLE", label: "1" },
      { type: "TABLE", label: "12" },
    ]);
  });
});
