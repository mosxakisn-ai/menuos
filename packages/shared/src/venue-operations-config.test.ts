import { describe, expect, it } from "vitest";

import {
  isReservedVenuePostId,
  normalizeVenueOperationsConfig,
  venueOperationsConfigSchema,
} from "./venue-operations-config";

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
