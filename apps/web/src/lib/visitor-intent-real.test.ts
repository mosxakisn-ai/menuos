import { describe, expect, it } from "vitest";
import {
  isAutomatedUserAgent,
  isKnownCrawlerIp,
  isRealCustomerVisitor,
} from "./visitor-intent-real";

const base = {
  sessionId: "abc12345-6789",
  surface: "marketing",
  step: "browse",
  path: "/",
  visitorLabel: null,
  clientIp: "85.72.10.1",
  stepTrail: [] as { step: string; at: number }[],
};

describe("isAutomatedUserAgent", () => {
  it("detects Googlebot", () => {
    expect(isAutomatedUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
  });

  it("allows normal Chrome", () => {
    expect(
      isAutomatedUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});

describe("isKnownCrawlerIp", () => {
  it("detects Google crawler IPs", () => {
    expect(isKnownCrawlerIp("66.249.253.188")).toBe(true);
  });

  it("allows regular IPs", () => {
    expect(isKnownCrawlerIp("85.72.10.1")).toBe(false);
  });
});

describe("isRealCustomerVisitor", () => {
  it("rejects blog-only Google crawler session", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        path: "/blog/menuos-live-360",
        clientIp: "66.249.253.188",
      }),
    ).toBe(false);
  });

  it("rejects blog-only scrape from datacenter", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        path: "/blog/pos-vazw-qr-sta-trapezia",
        clientIp: "152.44.110.112",
      }),
    ).toBe(false);
  });

  it("keeps homepage visitor", () => {
    expect(isRealCustomerVisitor({ ...base, path: "/" })).toBe(true);
  });

  it("keeps pricing funnel", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        path: "/pricing",
        step: "pricing",
        stepTrail: [{ step: "browse", at: Date.now() }, { step: "pricing", at: Date.now() }],
      }),
    ).toBe(true);
  });

  it("keeps register surface", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        surface: "register",
        path: "/register",
        step: "register_start",
      }),
    ).toBe(true);
  });

  it("keeps blog reader who opened pricing", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        path: "/blog/foo",
        stepTrail: [{ step: "browse", at: 1 }, { step: "pricing", at: 2 }],
      }),
    ).toBe(true);
  });

  it("rejects internal owner test account", () => {
    expect(
      isRealCustomerVisitor({
        ...base,
        visitorLabel: "mosxakisn@gmail.com",
        surface: "checkout",
        step: "payment_failed",
      }),
    ).toBe(false);
  });
});
