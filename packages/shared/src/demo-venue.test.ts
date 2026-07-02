import { describe, expect, it } from "vitest";
import { DEMO_VENUE_SLUG, isReservedVenueSlug } from "./demo-venue";

describe("isReservedVenueSlug", () => {
  it("blocks demo-taverna", () => {
    expect(isReservedVenueSlug(DEMO_VENUE_SLUG)).toBe(true);
    expect(isReservedVenueSlug("Demo-Taverna")).toBe(true);
  });

  it("allows normal slugs", () => {
    expect(isReservedVenueSlug("my-taverna")).toBe(false);
    expect(isReservedVenueSlug("asterousia")).toBe(false);
  });
});
