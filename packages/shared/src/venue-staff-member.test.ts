import { describe, expect, it } from "vitest";

import {
  migrateStaffAssignmentFromLegacy,
  migrateStaffStationsFromLegacy,
  normalizeStaffMemberZoneId,
  passDbStationsForStaffMember,
  passSignalVisibleToStaffMember,
  passSignalsVisibleToStaffMember,
  pickStationScreenForStaffAssignment,
  resolveStaffAssignmentToPassInput,
  resolveStaffMessageScope,
  sanitizeStaffAssignments,
  sanitizeStaffMessageScope,
  staffAssignmentLinkKind,
  defaultStaffAssignmentForJobRole,
  staffJobRoleForAssignment,
  staffPostOptionsForJobRole,
  staffPostPickerLabel,
  staffPrimaryAssignment,
  staffScreenDeviceForAssignment,
  staffScreenDeviceForJobRole,
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

describe("migrateStaffAssignmentFromLegacy", () => {
  const posts = [
    { id: "post-waiter", label: "Services Σάλα", enabled: true, station: "services" as const },
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
  ];

  it("maps legacy services to first waiter post", () => {
    expect(migrateStaffAssignmentFromLegacy("services", posts)).toBe("post-waiter");
    expect(migrateStaffAssignmentFromLegacy("kitchen", posts)).toBe("kitchen");
  });

  it("keeps services when no waiter post exists", () => {
    expect(migrateStaffAssignmentFromLegacy("services", [])).toBe("services");
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
    expect(normalizeStaffMemberZoneId("all", "all")).toBe("all");
    expect(normalizeStaffMemberZoneId("services", "all")).toBe("all");
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

  it("opens kitchen screen for support post staff", () => {
    const supportPosts = [
      { id: "lanza", label: "Λάντζα", enabled: true, station: "dishwash" as const },
    ];
    expect(resolveStaffAssignmentToPassInput("lanza", supportPosts)).toBe("kitchen");
    expect(
      pickStationScreenForStaffAssignment("lanza", supportPosts, screens)?.screenToken,
    ).toBe("tok-main");
  });
});

describe("staffAssignmentLinkKind", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "old", label: "Old", enabled: false, station: "bar" as const },
  ];

  it("keeps all as primary assignment", () => {
    expect(staffPrimaryAssignment(["all"])).toBe("all");
  });

  it("returns empty primary when no stations assigned", () => {
    expect(staffPrimaryAssignment([])).toBe("");
  });

  it("classifies waiter and pass", () => {
    expect(staffAssignmentLinkKind("services", posts)).toBe("waiter");
    expect(staffAssignmentLinkKind("kitchen", posts)).toBe("pass");
  });

  it("maps screen device from assignment", () => {
    expect(staffScreenDeviceForAssignment("services", posts)).toBe("mobile");
    expect(staffScreenDeviceForAssignment("kitchen", posts)).toBe("kds");
    expect(staffScreenDeviceForAssignment("pass-all", posts)).toBe("kds");
    expect(staffScreenDeviceForAssignment("missing", posts)).toBe("invalid");
  });

  it("marks disabled or unknown posts invalid", () => {
    expect(staffAssignmentLinkKind("old", posts)).toBe("invalid");
    expect(staffAssignmentLinkKind("missing", posts)).toBe("invalid");
  });
});

describe("staffPostPickerLabel", () => {
  const posts = [
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "bar", label: "Bar", enabled: true, station: "bar" as const },
  ];

  it("uses the post name from settings", () => {
    expect(staffPostPickerLabel("kitchen", "GR", posts)).toBe("Κουζίνα");
    expect(staffPostPickerLabel("bar", "GR", posts)).toBe("Bar");
  });

  it("lists each post by its configured label", () => {
    const multi = [
      { id: "k1", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
      { id: "k2", label: "Grill", enabled: true, station: "kitchen" as const },
    ];
    expect(staffPostPickerLabel("k2", "GR", multi)).toBe("Grill");
  });
});

describe("staffJobRole", () => {
  const posts = [
    { id: "svc-sala", label: "Services Σάλα", enabled: true, station: "services" as const },
    { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
    { id: "bar", label: "Bar", enabled: true, station: "bar" as const },
  ];

  it("derives role from assignment", () => {
    expect(staffJobRoleForAssignment("all", posts)).toBe("waiter");
    expect(staffJobRoleForAssignment("pass-all", posts)).toBe("pass");
    expect(staffJobRoleForAssignment("kitchen", posts)).toBe("pass");
    expect(staffJobRoleForAssignment("svc-sala", posts)).toBe("waiter");
  });

  it("filters post options by role", () => {
    expect(staffPostOptionsForJobRole("waiter", posts).map((row) => row.id)).toEqual([
      "all",
      "svc-sala",
    ]);
    expect(staffPostOptionsForJobRole("pass", posts).map((row) => row.id)).toEqual([
      "pass-all",
      "kitchen",
      "bar",
    ]);
  });

  it("maps role to screen device", () => {
    expect(staffScreenDeviceForJobRole("waiter")).toBe("mobile");
    expect(staffScreenDeviceForJobRole("pass")).toBe("kds");
    expect(defaultStaffAssignmentForJobRole("pass", posts)).toBe("pass-all");
  });

  it("omits pass-all when venue has only support tablet posts", () => {
    const supportOnly = [
      { id: "lanza", label: "Λάντζα", enabled: true, station: "dishwash" as const },
    ];
    expect(staffPostOptionsForJobRole("pass", supportOnly).map((row) => row.id)).toEqual(["lanza"]);
    expect(defaultStaffAssignmentForJobRole("pass", supportOnly)).toBe("lanza");
  });
});
