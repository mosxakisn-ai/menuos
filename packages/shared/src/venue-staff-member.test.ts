import { describe, expect, it } from "vitest";

import { passSignalVisibleToStaffMember, waiterCallsVisibleToStaffMember } from "./venue-staff-member";

describe("passSignalVisibleToStaffMember", () => {
  it("shows all stations for services or all", () => {
    expect(passSignalVisibleToStaffMember("KITCHEN", ["services"])).toBe(true);
    expect(passSignalVisibleToStaffMember("BAR", ["all"])).toBe(true);
  });

  it("filters by department tag", () => {
    expect(passSignalVisibleToStaffMember("KITCHEN", ["kitchen"])).toBe(true);
    expect(passSignalVisibleToStaffMember("BAR", ["kitchen"])).toBe(false);
    expect(passSignalVisibleToStaffMember("BAR", ["bar", "kitchen"])).toBe(true);
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
