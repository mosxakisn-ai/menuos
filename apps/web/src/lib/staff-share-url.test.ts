import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildStaffShareUrl, buildStationScreenShareUrl } from "./staff-share-url";

describe("buildStaffShareUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://menuos.gr", hostname: "menuos.gr", port: "" } });
  });

  it("builds friendly /s/ slug URL with key param", () => {
    expect(buildStaffShareUrl("demo-taverna", "abc-123")).toBe(
      "https://menuos.gr/s/demo-taverna?key=abc-123",
    );
  });

  it("uses public URL when opened via 0.0.0.0 bind address", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    vi.stubGlobal("window", {
      location: { origin: "http://0.0.0.0:3000", hostname: "0.0.0.0", port: "3000" },
    });
    expect(buildStaffShareUrl("demo-taverna", "abc-123")).toBe(
      "http://localhost:3000/s/demo-taverna?key=abc-123",
    );
  });
});

describe("buildStationScreenShareUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { location: { origin: "https://menuos.gr", hostname: "menuos.gr", port: "" } });
  });

  it("builds kitchen tablet URL", () => {
    expect(buildStationScreenShareUrl("kitchen", "hellas-taverna", "screen-token-1")).toBe(
      "https://menuos.gr/kds?venueSlug=hellas-taverna&key=screen-token-1",
    );
  });

  it("builds kitchen tablet URL with staff key", () => {
    expect(
      buildStationScreenShareUrl("kitchen", "hellas-taverna", "screen-token-1", {
        staffKey: "member-abc",
      }),
    ).toBe("https://menuos.gr/kds?venueSlug=hellas-taverna&key=screen-token-1&staffKey=member-abc");
  });
});
