import { describe, expect, it } from "vitest";
import { loginUrlWithCallback, safeDashboardCallbackUrl } from "./safe-callback-url";

describe("safe-callback-url", () => {
  it("allows dashboard paths with query", () => {
    expect(safeDashboardCallbackUrl("/dashboard/settings?tab=services")).toBe(
      "/dashboard/settings?tab=services",
    );
  });

  it("rejects external URLs", () => {
    expect(safeDashboardCallbackUrl("https://evil.com/dashboard")).toBeNull();
    expect(safeDashboardCallbackUrl("//evil.com/dashboard")).toBeNull();
    expect(safeDashboardCallbackUrl("/dashboard/../login")).toBeNull();
  });

  it("builds login URL with encoded callback", () => {
    expect(loginUrlWithCallback("/dashboard/settings?tab=services")).toBe(
      "/login?callbackUrl=%2Fdashboard%2Fsettings%3Ftab%3Dservices",
    );
  });
});
