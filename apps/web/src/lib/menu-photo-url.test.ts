import { describe, expect, it } from "vitest";
import { optimizeCoverPhotoUrl, optimizeMenuCardPhotoUrl } from "./menu-photo-url";

const SAMPLE =
  "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800";

describe("optimizeMenuCardPhotoUrl", () => {
  it("sizes hero embed cards to display width with lighter compression", () => {
    const url = optimizeMenuCardPhotoUrl(SAMPLE, 240);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("w")).toBe("240");
    expect(parsed.searchParams.get("h")).toBe("180");
    expect(parsed.searchParams.get("q")).toBe("48");
  });

  it("uses 1.5× width for large detail photos", () => {
    const url = optimizeMenuCardPhotoUrl(SAMPLE, 360);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("w")).toBe("440");
    expect(parsed.searchParams.get("q")).toBe("55");
  });

  it("sizes hero cover photos to display width with stronger compression", () => {
    const url = optimizeCoverPhotoUrl(SAMPLE, 460);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("w")).toBe("520");
    expect(parsed.searchParams.get("q")).toBe("55");
  });
});
