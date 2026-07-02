import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildStaffShareUrl } from "./staff-share-url";

describe("buildStaffShareUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://menuos.gr" } });
  });

  it("builds friendly /s/ slug URL with key param", () => {
    expect(buildStaffShareUrl("demo-taverna", "abc-123")).toBe(
      "https://menuos.gr/s/demo-taverna?key=abc-123",
    );
  });
});
