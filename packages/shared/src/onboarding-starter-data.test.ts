import { describe, expect, it } from "vitest";
import {
  DEMO_ORG_SLUG,
  DEMO_VENUE_SLUG,
  ONBOARDING_STARTER_CATEGORIES,
  ONBOARDING_STARTER_SPOTS,
  ONBOARDING_STARTER_STAFF,
  shouldSeedOnboardingVenue,
} from "./onboarding-starter-data";

describe("shouldSeedOnboardingVenue", () => {
  it("skips the public demo venue and master org", () => {
    expect(shouldSeedOnboardingVenue(DEMO_ORG_SLUG, DEMO_VENUE_SLUG)).toBe(false);
    expect(shouldSeedOnboardingVenue(DEMO_ORG_SLUG, "other-venue")).toBe(false);
    expect(shouldSeedOnboardingVenue("my-taverna", DEMO_VENUE_SLUG)).toBe(false);
  });

  it("seeds new customer venues", () => {
    expect(shouldSeedOnboardingVenue("maria-taverna", "main")).toBe(true);
  });
});

describe("onboarding starter pack", () => {
  it("includes menu, spots, and staff samples", () => {
    const itemCount = ONBOARDING_STARTER_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
    expect(ONBOARDING_STARTER_CATEGORIES.length).toBeGreaterThanOrEqual(3);
    expect(itemCount).toBeGreaterThanOrEqual(5);
    expect(ONBOARDING_STARTER_SPOTS.length).toBeGreaterThanOrEqual(10);
    expect(ONBOARDING_STARTER_STAFF.length).toBeGreaterThanOrEqual(4);
  });
});
