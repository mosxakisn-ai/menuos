import { describe, expect, it } from "vitest";

import {
  passDbStationsForStaffMember,
  passSignalVisibleToStaffMember,
  sanitizeStaffAssignments,
  waiterCallsVisibleToStaffMember,
} from "./venue-staff-member";

describe("passDbStationsForStaffMember", () => {
  it("returns null for floor staff", () => {
    expect(passDbStationsForStaffMember(["services"])).toBeNull();
    expect(passDbStationsForStaffMember(["all"])).toBeNull();
  });

  it("maps department tags to DB stations", () => {
    expect(passDbStationsForStaffMember(["kitchen"])).toEqual(["KITCHEN"]);
    expect(passDbStationsForStaffMember(["bar", "kitchen"])).toEqual(["BAR", "KITCHEN"]);
  });
});

describe("passSignalVisibleToStaffMember", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "grill", label: "Grill", enabled: true, station: "kitchen" as const },
    { id: "bar", label: "Μπαρ", enabled: true, station: "bar" as const },
  ];

  it("shows all stations for services or all", () => {
    expect(passSignalVisibleToStaffMember("KITCHEN", ["services"])).toBe(true);
    expect(passSignalVisibleToStaffMember("BAR", ["all"])).toBe(true);
  });

  it("filters by department tag", () => {
    expect(passSignalVisibleToStaffMember("KITCHEN", ["kitchen"])).toBe(true);
    expect(passSignalVisibleToStaffMember("BAR", ["kitchen"])).toBe(false);
    expect(passSignalVisibleToStaffMember("BAR", ["bar", "kitchen"])).toBe(true);
  });

  it("filters by custom post id", () => {
    expect(passSignalVisibleToStaffMember("KITCHEN", ["grill"], posts)).toBe(true);
    expect(passSignalVisibleToStaffMember("BAR", ["grill"], posts)).toBe(false);
  });
});

describe("waiterCallsVisibleToStaffMember", () => {
  it("allows floor staff only", () => {
    expect(waiterCallsVisibleToStaffMember(["services"])).toBe(true);
    expect(waiterCallsVisibleToStaffMember(["all"])).toBe(true);
    expect(waiterCallsVisibleToStaffMember(["kitchen"])).toBe(false);
    expect(waiterCallsVisibleToStaffMember(["bar"])).toBe(false);
  });
});

describe("sanitizeStaffAssignments", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "grill", label: "Grill", enabled: false, station: "kitchen" as const },
    { id: "bar", label: "Μπαρ", enabled: true, station: "bar" as const },
  ];

  it("keeps special options and enabled posts", () => {
    expect(sanitizeStaffAssignments(["services", "kitchen", "bar"], posts)).toEqual([
      "services",
      "kitchen",
      "bar",
    ]);
  });

  it("drops disabled or removed post ids and dedupes", () => {
    expect(sanitizeStaffAssignments(["grill", "kitchen", "kitchen", "missing"], posts)).toEqual([
      "kitchen",
    ]);
  });

  it("can return empty when nothing valid remains", () => {
    expect(sanitizeStaffAssignments(["grill", "missing"], posts)).toEqual([]);
  });
});
