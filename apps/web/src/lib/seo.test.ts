import { describe, expect, it } from "vitest";
import { buildHreflangAlternates, localeAbsoluteUrl } from "./seo";

describe("localeAbsoluteUrl", () => {
  it("keeps default locale clean", () => {
    expect(localeAbsoluteUrl("/pricing", "el")).toBe("https://menuos.gr/pricing");
    expect(localeAbsoluteUrl("/", "el")).toBe("https://menuos.gr/");
  });

  it("adds ?lang= for English", () => {
    expect(localeAbsoluteUrl("/pricing", "en")).toBe("https://menuos.gr/pricing?lang=en");
    expect(localeAbsoluteUrl("/", "en")).toBe("https://menuos.gr/?lang=en");
  });
});

describe("buildHreflangAlternates", () => {
  it("uses self-referencing canonical for Greek", () => {
    const alt = buildHreflangAlternates("/pricing", ["el", "en"], "el");
    expect(alt.canonical).toBe("https://menuos.gr/pricing");
    expect(alt.languages).toEqual({
      el: "https://menuos.gr/pricing",
      en: "https://menuos.gr/pricing?lang=en",
      "x-default": "https://menuos.gr/pricing",
    });
  });

  it("uses self-referencing canonical for English", () => {
    const alt = buildHreflangAlternates("/pricing", ["el", "en"], "en");
    expect(alt.canonical).toBe("https://menuos.gr/pricing?lang=en");
    expect(alt.languages?.en).toBe("https://menuos.gr/pricing?lang=en");
    expect(alt.languages?.el).toBe("https://menuos.gr/pricing");
  });

  it("falls back when current locale is not in hreflang set (blog)", () => {
    const alt = buildHreflangAlternates("/blog/foo", ["el"], "en");
    expect(alt.canonical).toBe("https://menuos.gr/blog/foo");
    expect(alt.languages).toEqual({
      el: "https://menuos.gr/blog/foo",
      "x-default": "https://menuos.gr/blog/foo",
    });
  });
});
