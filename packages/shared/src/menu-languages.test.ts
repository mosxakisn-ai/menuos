import { describe, expect, it } from "vitest";
import { pickQrMenuItemTranslation, pickQrMenuTranslation } from "./menu-languages";

describe("pickQrMenuTranslation", () => {
  const rows = [
    { language: "GR", name: "Σαλάτα" },
    { language: "EN", name: "Salad" },
    { language: "DE", name: "Salat" },
  ];

  it("returns the selected language when present", () => {
    expect(pickQrMenuTranslation(rows, "DE")?.name).toBe("Salat");
  });

  it("prefers EN over GR when DE is missing", () => {
    expect(pickQrMenuTranslation(rows, "FR")?.name).toBe("Salad");
  });

  it("prefers GR when selected language is Greek", () => {
    expect(pickQrMenuTranslation(rows, "GR")?.name).toBe("Σαλάτα");
  });

  it("skips empty translation rows", () => {
    const sparse = [
      { language: "GR", name: "Ποτά" },
      { language: "EN", name: "   " },
      { language: "DE", name: "Getränke" },
    ];
    expect(pickQrMenuTranslation(sparse, "EN")?.name).toBe("Getränke");
  });
});

describe("pickQrMenuItemTranslation", () => {
  it("falls back description from EN when DE row has no description", () => {
    const rows = [
      { language: "GR", name: "Χωριάτικη", description: "Ντομάτα, αγγούρι, φέτα" },
      { language: "EN", name: "Greek salad", description: "Tomato, cucumber, feta" },
      { language: "DE", name: "Griechischer Salat", description: null },
    ];
    const tr = pickQrMenuItemTranslation(rows, "DE");
    expect(tr?.name).toBe("Griechischer Salat");
    expect(tr?.description).toBe("Tomato, cucumber, feta");
  });

  it("falls back description from GR when only Greek has text", () => {
    const rows = [
      { language: "GR", name: "Χωριάτικη", description: "Ντομάτα, αγγούρι" },
      { language: "EN", name: "Greek salad", description: null },
      { language: "DE", name: "Griechischer Salat", description: null },
    ];
    const tr = pickQrMenuItemTranslation(rows, "FR");
    expect(tr?.description).toBe("Ντομάτα, αγγούρι");
  });
});
