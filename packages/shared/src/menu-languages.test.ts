import { describe, expect, it } from "vitest";
import { pickQrMenuTranslation } from "./menu-languages";

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
