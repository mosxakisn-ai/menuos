import { describe, expect, it } from "vitest";
import {
  computeTrialGraceEndsAt,
  getTrialAccessPhase,
  getTrialDaysLeft,
  getTrialGraceDaysLeft,
  isTrialInGracePeriod,
  isTrialStillActive,
  TRIAL_GRACE_DAYS,
} from "./trial";
import { getPlan, isPaidPlan, organizationHasPaidPlan, TRIAL_DAYS } from "./plans";

describe("organizationHasPaidPlan", () => {
  it("allows active trial before expiry", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(organizationHasPaidPlan({ plan: "TRIAL", status: "TRIALING", trialEndsAt: future })).toBe(
      true,
    );
  });

  it("allows trial during grace period after trial end", () => {
    const trialEndedYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      organizationHasPaidPlan({ plan: "TRIAL", status: "TRIALING", trialEndsAt: trialEndedYesterday }),
    ).toBe(true);
  });

  it("blocks trial after grace period", () => {
    const trialEnded = new Date(Date.now() - (TRIAL_GRACE_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(organizationHasPaidPlan({ plan: "TRIAL", status: "TRIALING", trialEndsAt: trialEnded })).toBe(
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

describe("trial access phases", () => {
  it("computes grace end TRIAL_GRACE_DAYS after trial", () => {
    const trialEndsAt = new Date("2026-07-01T12:00:00Z");
    const graceEndsAt = computeTrialGraceEndsAt(trialEndsAt);
    expect(getTrialDaysLeft(graceEndsAt, trialEndsAt)).toBe(TRIAL_GRACE_DAYS);
  });

  it("detects grace phase", () => {
    const trialEndsAt = new Date(Date.now() - 60_000);
    expect(isTrialStillActive(trialEndsAt)).toBe(false);
    expect(isTrialInGracePeriod(trialEndsAt)).toBe(true);
    expect(getTrialAccessPhase(trialEndsAt)).toBe("grace");
    expect(getTrialGraceDaysLeft(trialEndsAt)).toBeGreaterThan(0);
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

  it("uses 7-day trial", () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(TRIAL_GRACE_DAYS).toBe(7);
  });
});
