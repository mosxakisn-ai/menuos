import { describe, expect, it } from "vitest";
import {
  formatVenueSpotLabel,
  formatWaiterCallLocation,
  isValidVenueSpotLabel,
  normalizeWaiterCallLocation,
  spotToQueryParams,
  waiterCallLocationMatches,
} from "./venue-spots";

describe("isValidVenueSpotLabel", () => {
  it("accepts numeric and prefixed labels", () => {
    expect(isValidVenueSpotLabel("12")).toBe(true);
    expect(isValidVenueSpotLabel("sala-1")).toBe(true);
    expect(isValidVenueSpotLabel("vip_2")).toBe(true);
  });

  it("rejects empty, too long, or invalid chars", () => {
    expect(isValidVenueSpotLabel("")).toBe(false);
    expect(isValidVenueSpotLabel("a".repeat(21))).toBe(false);
    expect(isValidVenueSpotLabel("table 12")).toBe(false);
  });
});

describe("formatVenueSpotLabel", () => {
  it("prefixes pure numbers with type label", () => {
    expect(formatVenueSpotLabel("TABLE", "12")).toBe("Τραπέζι 12");
    expect(formatVenueSpotLabel("ROOM", "204")).toBe("Δωμάτιο 204");
  });

  it("keeps custom labels as-is", () => {
    expect(formatVenueSpotLabel("TABLE", "sala-1")).toBe("sala-1");
  });
});

describe("spotToQueryParams", () => {
  it("maps spot type to QR query param", () => {
    expect(spotToQueryParams("TABLE", "12")).toEqual({ table: "12" });
    expect(spotToQueryParams("ROOM", "204")).toEqual({ room: "204" });
    expect(spotToQueryParams("SUNBED", "A3")).toEqual({ sunbed: "A3" });
  });
});

describe("normalizeWaiterCallLocation", () => {
  it("prefers sunbed over room over table", () => {
    expect(
      normalizeWaiterCallLocation({ tableNumber: "1", roomNumber: "204", sunbedNumber: "A5" }),
    ).toEqual({ sunbedNumber: "A5" });
    expect(normalizeWaiterCallLocation({ tableNumber: "1", roomNumber: "204" })).toEqual({
      roomNumber: "204",
    });
  });
});

describe("waiterCallLocationMatches", () => {
  it("matches stored spot against request", () => {
    expect(waiterCallLocationMatches({ tableNumber: "12" }, { tableNumber: "12" })).toBe(true);
    expect(waiterCallLocationMatches({ tableNumber: "12" }, { tableNumber: "13" })).toBe(false);
  });

  it("matches numeric tables with or without leading zeros", () => {
    expect(waiterCallLocationMatches({ tableNumber: "5" }, { tableNumber: "05" })).toBe(true);
    expect(waiterCallLocationMatches({ tableNumber: "012" }, { tableNumber: "12" })).toBe(true);
  });
});

describe("formatWaiterCallLocation", () => {
  it("formats display string for staff panel", () => {
    expect(formatWaiterCallLocation({ tableNumber: "12" })).toBe("Τραπέζι 12");
    expect(formatWaiterCallLocation({})).toBe("Χωρίς θέση");
  });
});
