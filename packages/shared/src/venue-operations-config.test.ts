import { describe, expect, it } from "vitest";

import {
  isPlaceholderVenuePostLabel,
  isReservedVenuePostId,
  normalizeVenueOperationsConfig,
  passReadyLabelForSignal,
  passReadyLabelsFromConfig,
  quickChipsForPost,
  resolvePostIdForStationScreen,
  staffAssignableVenuePosts,
  stationScreenLabelMatchesPost,
  tableLegendStates,
  venueOperationsConfigSchema,
  visibleMessagesForStaffAssignment,
} from "./venue-operations-config";

describe("quickChipsForPost", () => {
  it("returns chips keyed by post id", () => {
    const config = {
      enabledStations: ["kitchen" as const, "bar" as const],
      posts: [
        { id: "grill", label: "Grill", enabled: true, station: "kitchen" as const },
        { id: "kitchen", label: "Kitchen", enabled: true, station: "kitchen" as const },
      ],
      quickChips: { grill: ["Custom grill msg"] },
    };
    expect(quickChipsForPost(config, "grill")).toEqual(["Custom grill msg"]);
    expect(quickChipsForPost(config, "kitchen", "EN")).toEqual([]);
  });

  it("falls back to legacy station key for single post", () => {
    const config = {
      enabledStations: ["kitchen" as const],
      quickChips: { kitchen: ["Legacy"] },
    };
    expect(quickChipsForPost(config, "kitchen")).toEqual(["Legacy"]);
  });
});

describe("resolvePostIdForStationScreen", () => {
  it("matches screen label to post label", () => {
    const config = {
      enabledStations: ["kitchen" as const],
      posts: [
        { id: "grill", label: "Grill", enabled: true, station: "kitchen" as const },
        { id: "kitchen", label: "Kitchen", enabled: true, station: "kitchen" as const },
      ],
    };
    expect(resolvePostIdForStationScreen(config, "kitchen", "Grill")).toBe("grill");
  });
});

describe("migrateLegacyQuickChipsToPostIds", () => {
  it("copies station keys to post ids on normalize", () => {
    const config = normalizeVenueOperationsConfig({
      enabledStations: ["kitchen" as const, "bar" as const],
      posts: [
        { id: "k1", label: "Kitchen", enabled: true, station: "kitchen" as const },
        { id: "b1", label: "Bar", enabled: true, station: "bar" as const },
      ],
      quickChips: { kitchen: ["Pass ready"], bar: ["No ice"] },
    });
    expect(config.quickChips?.k1).toEqual(["Pass ready"]);
    expect(config.quickChips?.b1).toEqual(["No ice"]);
    expect(config.quickChips?.kitchen).toBeUndefined();
  });
});

describe("stationScreenLabelMatchesPost", () => {
  const config = {
    enabledStations: ["kitchen" as const, "bar" as const],
    posts: [
      { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
      { id: "bar", label: "Bar", enabled: true, station: "bar" as const },
    ],
  };

  it("returns true when label matches enabled post for station", () => {
    expect(stationScreenLabelMatchesPost(config, "kitchen", "Κουζίνα")).toBe(true);
    expect(stationScreenLabelMatchesPost(config, "bar", "Bar")).toBe(true);
  });

  it("returns false for mismatched or empty labels", () => {
    expect(stationScreenLabelMatchesPost(config, "kitchen", "Bar")).toBe(false);
    expect(stationScreenLabelMatchesPost(config, "kitchen", "  ")).toBe(false);
  });

  it("returns true when config is undefined (no check yet)", () => {
    expect(stationScreenLabelMatchesPost(undefined, "kitchen", "Anything")).toBe(true);
  });
});

describe("tableLegendStates", () => {
  it("hides optional states when listed in hiddenTableStates", () => {
    const config = {
      enabledStations: ["kitchen" as const, "bar" as const],
      hiddenTableStates: ["kitchen_ready" as const, "both" as const],
    };
    expect(tableLegendStates(config)).toEqual(["idle", "guest_call", "bar_ready"]);
  });
});

describe("visibleMessagesForStaffAssignment", () => {
  it("returns map labels for services", () => {
    const result = visibleMessagesForStaffAssignment(undefined, "services", "GR");
    expect(result.kind).toBe("waiter_map");
    expect(result.labels.length).toBeGreaterThan(0);
  });

  it("returns pass chips for post id", () => {
    const config = {
      enabledStations: ["bar" as const],
      posts: [{ id: "bar", label: "Bar", enabled: true, station: "bar" as const }],
      quickChips: { bar: ["No ice"] },
    };
    const result = visibleMessagesForStaffAssignment(config, "bar");
    expect(result.kind).toBe("pass_quick");
    expect(result.labels).toEqual(["No ice"]);
  });
});

describe("passReadyLabelsFromConfig", () => {
  it("uses custom table state labels from settings", () => {
    const config = {
      enabledStations: ["kitchen" as const, "bar" as const],
      tableStateLabels: {
        kitchen_ready: "Έτοιμο — Κουζίνα · Σερβιτόροι",
        bar_ready: "Έτοιμο — BarMan",
      },
    };
    const labels = passReadyLabelsFromConfig(config, "GR");
    expect(labels.kitchen).toBe("Έτοιμο — Κουζίνα · Σερβιτόροι");
    expect(labels.bar).toBe("Έτοιμο — BarMan");
  });
});

describe("passReadyLabelForSignal", () => {
  it("prefers custom map label over post name", () => {
    const config = {
      enabledStations: ["kitchen" as const],
      posts: [{ id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const }],
      tableStateLabels: { kitchen_ready: "Custom kitchen label" },
    };
    expect(
      passReadyLabelForSignal(config, { station: "KITCHEN", stationScreenLabel: "Κουζίνα" }, "GR"),
    ).toBe("Custom kitchen label");
  });
});

describe("isReservedVenuePostId", () => {
  it("flags staff-only tokens", () => {
    expect(isReservedVenuePostId("services")).toBe(true);
    expect(isReservedVenuePostId("all")).toBe(true);
    expect(isReservedVenuePostId("kitchen")).toBe(false);
    expect(isReservedVenuePostId("post-abc")).toBe(false);
  });
});

describe("venueOperationsConfigSchema", () => {
  it("rejects reserved post ids", () => {
    const result = venueOperationsConfigSchema.safeParse({
      enabledStations: ["kitchen"],
      posts: [{ id: "services", label: "Services", enabled: true, station: "kitchen" }],
    });
    expect(result.success).toBe(false);
  });

  it("dedupes duplicate post ids on normalize", () => {
    const config = normalizeVenueOperationsConfig({
      enabledStations: ["kitchen", "bar"],
      posts: [
        { id: "kitchen", label: "A", enabled: true, station: "kitchen" },
        { id: "kitchen", label: "B", enabled: true, station: "kitchen" },
        { id: "bar", label: "Bar", enabled: true, station: "bar" },
      ],
    });
    expect(config.posts?.map((post) => post.id)).toEqual(["kitchen", "bar"]);
    expect(config.posts?.[0]?.label).toBe("A");
  });
});

describe("staffAssignableVenuePosts", () => {
  it("excludes placeholder and waiter junk posts", () => {
    const config = {
      enabledStations: ["kitchen" as const, "bar" as const],
      posts: [
        { id: "kitchen", label: "Κουζίνα", enabled: true, station: "kitchen" as const },
        { id: "p-new", label: "Νέο πόστο", enabled: true, station: "kitchen" as const },
        { id: "waiter", label: "Σερβιτόρος", enabled: true, station: "bar" as const },
        { id: "bar", label: "Bar", enabled: true, station: "bar" as const },
      ],
    };
    const assignable = staffAssignableVenuePosts(config, "GR");
    expect(assignable.map((post) => post.id)).toEqual(["kitchen", "bar"]);
  });

  it("detects placeholder labels", () => {
    expect(isPlaceholderVenuePostLabel("Νέο πόστο")).toBe(true);
    expect(isPlaceholderVenuePostLabel("New post")).toBe(true);
    expect(isPlaceholderVenuePostLabel("Κουζίνα")).toBe(false);
  });
});
