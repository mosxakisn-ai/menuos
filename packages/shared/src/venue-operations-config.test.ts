import { describe, expect, it } from "vitest";

import {
  isReservedVenuePostId,
  normalizeVenueOperationsConfig,
  quickChipsForPost,
  resolvePostIdForStationScreen,
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
    expect(quickChipsForPost(config, "kitchen", "EN")[0]).toBeTruthy();
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
