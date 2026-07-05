import { describe, expect, it } from "vitest";

import {
  normalizeStaffMemberZoneId,
  passDbStationsForStaffMember,
  passSignalVisibleToStaffMember,
  passSignalsVisibleToStaffMember,
  pickStationScreenForStaffAssignment,
  resolveStaffMessageScope,
  sanitizeStaffAssignments,
  sanitizeStaffMessageScope,
  staffAssignmentLinkKind,
  staffPrimaryAssignment,
  validateStaffMessageScope,
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

  it("hides unknown stations for restricted staff", () => {
    expect(passSignalVisibleToStaffMember("UNKNOWN", ["kitchen"])).toBe(false);
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

describe("passSignalsVisibleToStaffMember", () => {
  it("allows floor and station staff", () => {
    expect(passSignalsVisibleToStaffMember(["services"])).toBe(true);
    expect(passSignalsVisibleToStaffMember(["kitchen"])).toBe(true);
  });

  it("blocks empty assignments", () => {
    expect(passSignalsVisibleToStaffMember([])).toBe(false);
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

  it("returns empty when nothing valid remains (no privilege escalation)", () => {
    expect(sanitizeStaffAssignments(["grill", "missing"], posts)).toEqual([]);
    expect(passSignalsVisibleToStaffMember([])).toBe(false);
    expect(waiterCallsVisibleToStaffMember([])).toBe(false);
  });
});

describe("validateStaffMessageScope", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "grill", label: "Grill", enabled: false, station: "kitchen" as const },
  ];

  it("accepts services and enabled posts only", () => {
    expect(validateStaffMessageScope("services", posts)).toBe(true);
    expect(validateStaffMessageScope("kitchen", posts)).toBe(true);
    expect(validateStaffMessageScope("all", posts)).toBe(false);
    expect(validateStaffMessageScope("grill", posts)).toBe(false);
  });
});

describe("resolveStaffMessageScope", () => {
  it("uses persisted scope when set", () => {
    expect(resolveStaffMessageScope({ messageScope: "kitchen", stations: ["services"] })).toBe(
      "kitchen",
    );
  });

  it("falls back to post assignment", () => {
    expect(resolveStaffMessageScope({ messageScope: null, stations: ["bar"] })).toBe("bar");
    expect(resolveStaffMessageScope({ messageScope: null, stations: ["all"] })).toBe("services");
  });

  it("falls back when persisted scope is invalid", () => {
    const posts = [
      { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    ];
    expect(
      resolveStaffMessageScope({ messageScope: "deleted-post", stations: ["services"] }, posts),
    ).toBe("services");
  });
});

describe("sanitizeStaffMessageScope", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "grill", label: "Grill", enabled: false, station: "kitchen" as const },
  ];

  it("keeps valid scope", () => {
    expect(sanitizeStaffMessageScope("kitchen", ["services"], posts)).toBe("kitchen");
  });

  it("clears invalid scope to fallback", () => {
    expect(sanitizeStaffMessageScope("grill", ["kitchen"], posts)).toBe("kitchen");
  });
});

describe("normalizeStaffMemberZoneId", () => {
  it("clears zone for pass posts", () => {
    expect(normalizeStaffMemberZoneId("kitchen", "prefix:main")).toBeNull();
    expect(normalizeStaffMemberZoneId("post-1", "prefix:main")).toBeNull();
  });

  it("keeps zone for waiters", () => {
    expect(normalizeStaffMemberZoneId("services", "prefix:main")).toBe("prefix:main");
    expect(normalizeStaffMemberZoneId("services", "")).toBeNull();
  });
});

describe("pickStationScreenForStaffAssignment", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "grill", label: "Grill", enabled: true, station: "kitchen" as const },
    { id: "bar", label: "Μπαρ", enabled: true, station: "bar" as const },
  ];
  const screens = [
    { label: "Κουζίνα", screenToken: "tok-main" },
    { label: "Grill", screenToken: "tok-grill" },
  ];

  it("matches screen label to post label", () => {
    expect(pickStationScreenForStaffAssignment("grill", posts, screens)?.screenToken).toBe(
      "tok-grill",
    );
  });

  it("falls back to first screen", () => {
    expect(pickStationScreenForStaffAssignment("kitchen", posts, screens)?.screenToken).toBe(
      "tok-main",
    );
  });

  it("returns null for floor staff", () => {
    expect(pickStationScreenForStaffAssignment("services", posts, screens)).toBeNull();
  });
});

describe("staffAssignmentLinkKind", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "old", label: "Old", enabled: false, station: "bar" as const },
  ];

  it("maps legacy all assignment to services primary", () => {
    expect(staffPrimaryAssignment(["all"])).toBe("services");
  });

  it("classifies waiter and pass", () => {
    expect(staffAssignmentLinkKind("services", posts)).toBe("waiter");
    expect(staffAssignmentLinkKind("kitchen", posts)).toBe("pass");
  });

  it("marks disabled or unknown posts invalid", () => {
    expect(staffAssignmentLinkKind("old", posts)).toBe("invalid");
    expect(staffAssignmentLinkKind("missing", posts)).toBe("invalid");
  });
});
