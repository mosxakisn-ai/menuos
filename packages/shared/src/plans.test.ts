import { describe, expect, it } from "vitest";
import { getPlan, isPaidPlan, organizationHasPaidPlan } from "./plans";

describe("organizationHasPaidPlan", () => {
  it("allows active trial before expiry", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(organizationHasPaidPlan({ plan: "TRIAL", status: "TRIALING", trialEndsAt: future })).toBe(
      true,
    );
  });

  it("blocks expired trial", () => {
    const past = new Date(Date.now() - 1000);
    expect(organizationHasPaidPlan({ plan: "TRIAL", status: "TRIALING", trialEndsAt: past })).toBe(
      false,
    );
  });

  it("treats paid plans with PAST_DUE as active (grace)", () => {
    expect(organizationHasPaidPlan({ plan: "PRO", status: "PAST_DUE" })).toBe(true);
  });

  it("blocks canceled paid plan", () => {
    expect(organizationHasPaidPlan({ plan: "PRO", status: "CANCELED" })).toBe(false);
  });

  it("allows enterprise when status active", () => {
    expect(organizationHasPaidPlan({ plan: "ENTERPRISE", status: "ACTIVE" })).toBe(true);
  });
});

describe("plan helpers", () => {
  it("identifies paid plan ids", () => {
    expect(isPaidPlan("BASIC")).toBe(true);
    expect(isPaidPlan("TRIAL")).toBe(false);
  });

  it("returns trial limits", () => {
    expect(getPlan("TRIAL").maxItems).toBe(50);
    expect(getPlan("TRIAL").maxMenusPerVenue).toBe(1);
  });
});
