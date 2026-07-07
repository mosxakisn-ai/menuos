import { describe, expect, it } from "vitest";
import {
  filterVenueSpotsForScreen,
  MAIN_HALL_SPOT_PREFIX,
  normalizeStationScreenSpotPrefix,
  passLocationMatchesScreenSpotPrefix,
  passLocationMatchesZoneOrScreenPrefix,
  spotPrefixForVenuePost,
} from "./station-screen-spots";

const spots = [
  { type: "TABLE" as const, label: "1" },
  { type: "TABLE" as const, label: "12" },
  { type: "TABLE" as const, label: "Αυλή-1" },
  { type: "TABLE" as const, label: "Αυλή-2" },
  { type: "TABLE" as const, label: "αυλή-3" },
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

describe("spotPrefixForVenuePost", () => {
  it("maps main hall zone to numeric table prefix", () => {
    expect(spotPrefixForVenuePost({ zoneId: "main" })).toBe(MAIN_HALL_SPOT_PREFIX);
  });

  it("maps prefixed yard zone to yard prefix", () => {
    expect(
      spotPrefixForVenuePost({ zoneId: "prefix:αυλή" }, { "prefix:αυλή": "Αυλή" }),
    ).toBe("Αυλή");
  });

  it("returns null when post has no zone", () => {
    expect(spotPrefixForVenuePost({ zoneId: null })).toBeNull();
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
      { type: "TABLE", label: "αυλή-3" },
    ]);
  });

  it("matches prefix case-insensitively", () => {
    expect(filterVenueSpotsForScreen(spots, "αυλή")).toEqual([
      { type: "TABLE", label: "Αυλή-1" },
      { type: "TABLE", label: "Αυλή-2" },
      { type: "TABLE", label: "αυλή-3" },
    ]);
  });

  it("filters main hall to numeric tables only", () => {
    expect(filterVenueSpotsForScreen(spots, MAIN_HALL_SPOT_PREFIX)).toEqual([
      { type: "TABLE", label: "1" },
      { type: "TABLE", label: "12" },
    ]);
    expect(filterVenueSpotsForScreen(spots, "σαλόνι")).toEqual([
      { type: "TABLE", label: "1" },
      { type: "TABLE", label: "12" },
    ]);
  });
});

describe("passLocationMatchesScreenSpotPrefix", () => {
  it("allows any location when prefix is unset", () => {
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "99" }, null)).toBe(true);
    expect(passLocationMatchesScreenSpotPrefix({ sunbedNumber: "A1" }, null)).toBe(true);
  });

  it("rejects tables outside the zone", () => {
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "5" }, "Αυλή")).toBe(false);
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "Αυλή-2" }, "Αυλή")).toBe(true);
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "αυλή-2" }, "Αυλή")).toBe(true);
  });

  it("rejects sunbeds and rooms when prefix is set", () => {
    expect(passLocationMatchesScreenSpotPrefix({ sunbedNumber: "A1" }, "Αυλή")).toBe(false);
    expect(passLocationMatchesScreenSpotPrefix({ roomNumber: "101" }, "Αυλή")).toBe(false);
  });

  it("allows only numeric tables for main hall prefix", () => {
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "8" }, MAIN_HALL_SPOT_PREFIX)).toBe(true);
    expect(passLocationMatchesScreenSpotPrefix({ tableNumber: "Αυλή-1" }, MAIN_HALL_SPOT_PREFIX)).toBe(false);
  });
});

describe("passLocationMatchesZoneOrScreenPrefix", () => {
  it("uses zone tab prefix instead of screen prefix when zoneId is sent", () => {
    expect(
      passLocationMatchesZoneOrScreenPrefix(
        { tableNumber: "Αυλή-1" },
        {
          spotPrefix: MAIN_HALL_SPOT_PREFIX,
          zoneId: "prefix:αυλή",
          zoneLabels: { "prefix:αυλή": "Αυλή" },
        },
      ),
    ).toBe(true);
  });

  it("accepts bare table number in active prefixed zone", () => {
    expect(
      passLocationMatchesZoneOrScreenPrefix(
        { tableNumber: "1" },
        {
          spotPrefix: MAIN_HALL_SPOT_PREFIX,
          zoneId: "prefix:αυλή",
          zoneLabels: { "prefix:αυλή": "Αυλή" },
        },
      ),
    ).toBe(true);
  });

  it("falls back to screen prefix when zoneId is absent", () => {
    expect(
      passLocationMatchesZoneOrScreenPrefix({ tableNumber: "5" }, { spotPrefix: "Αυλή" }),
    ).toBe(false);
    expect(
      passLocationMatchesZoneOrScreenPrefix({ tableNumber: "Αυλή-2" }, { spotPrefix: "Αυλή" }),
    ).toBe(true);
  });

  it("allows room and sunbed when KDS sends matching zoneId", () => {
    expect(
      passLocationMatchesZoneOrScreenPrefix(
        { roomNumber: "101" },
        { spotPrefix: "Αυλή", zoneId: "room" },
      ),
    ).toBe(true);
    expect(
      passLocationMatchesZoneOrScreenPrefix(
        { sunbedNumber: "A1" },
        { spotPrefix: MAIN_HALL_SPOT_PREFIX, zoneId: "sunbed" },
      ),
    ).toBe(true);
  });
});

