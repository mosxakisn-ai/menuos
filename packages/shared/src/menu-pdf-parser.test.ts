import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseMenuTextFromPdf, resetMenuPdfParserIds, splitBilingualMenuName } from "./menu-pdf-parser";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const beverageFixture = readFileSync(
  join(fixtureDir, "menu-pdf-parser.beverage.fixture.txt"),
  "utf8",
);

describe("splitBilingualMenuName", () => {
  it("puts Greek in nameGr and English in nameEn", () => {
    expect(splitBilingualMenuName("Χωριάτικη | Greek salad")).toEqual({
      nameGr: "Χωριάτικη",
      nameEn: "Greek salad",
    });
    expect(splitBilingualMenuName("PASTA / Ζυμαρικά")).toEqual({
      nameGr: "Ζυμαρικά",
      nameEn: "PASTA",
    });
  });

  it("maps Latin-only lines to English field (Greek filled via AI translate on import)", () => {
    expect(splitBilingualMenuName("Espresso Martini")).toEqual({
      nameGr: "Espresso Martini",
      nameEn: "Espresso Martini",
    });
    expect(splitBilingualMenuName("PASTA")).toEqual({ nameGr: "PASTA", nameEn: "PASTA" });
  });
});

describe("parseMenuTextFromPdf — Kozas-style scanned menu", () => {
  const kozasFixture = readFileSync(join(fixtureDir, "menu-pdf-parser.kozas.fixture.txt"), "utf8");

  it("splits merged OCR lines and skips notes", () => {
    resetMenuPdfParserIds();
    const result = parseMenuTextFromPdf(kozasFixture, "kozas.pdf");

    const names = result.categories.flatMap((c) => c.items.map((i) => i.nameGr));
    expect(names).not.toContain("ΖΥΜΑΡΙΚΑ");
    expect(names).not.toContain("ΣΟΥΠΕΣ");
    expect(names).not.toContain("ΟΣΤΡΑΚΟΕΙΔΗ");
    expect(names.some((n) => n.includes("Tzatziki"))).toBe(true);
    expect(names.some((n) => n.includes("Cuttlefish"))).toBe(true);
    expect(names.some((n) => n.includes("Calamari"))).toBe(true);
    expect(names.some((n) => n.toLowerCase().includes("choice of"))).toBe(false);
    expect(names.some((n) => n.toLowerCase().includes("please let us"))).toBe(false);

    expect(result.categories.find((c) => c.nameGr === "ΖΥΜΑΡΙΚΑ")).toBeDefined();
    expect(result.categories.find((c) => c.nameGr === "ΣΟΥΠΕΣ")).toBeDefined();

    const tzatziki = result.categories
      .flatMap((c) => c.items)
      .find((i) => i.nameGr.includes("Tzatziki"));
    const cuttlefish = result.categories
      .flatMap((c) => c.items)
      .find((i) => i.nameGr.includes("Cuttlefish"));
    expect(tzatziki?.price).toBe(7.4);
    expect(cuttlefish?.price).toBe(16);
  });

  it("pairs name blocks with trailing price-only OCR lines", () => {
    resetMenuPdfParserIds();
    const text = `STARTERS
Home made Tzatziki
Fresh fried potatoes
Mizithra pie
9.50€
9.00€
7.40€`;
    const result = parseMenuTextFromPdf(text, "block.pdf");
    const names = result.categories.flatMap((c) => c.items.map((i) => i.nameGr));
    expect(names.some((n) => n.includes("Tzatziki"))).toBe(true);
    expect(names.some((n) => n.includes("potatoes"))).toBe(true);
    expect(result.categories.flatMap((c) => c.items).find((i) => i.nameGr.includes("Tzatziki"))?.price).toBe(9.5);
  });
});

describe("parseMenuTextFromPdf — bilingual beverage PDF", () => {
  it("extracts categories and items from hotel drink list layout", () => {
    resetMenuPdfParserIds();
    const result = parseMenuTextFromPdf(beverageFixture, "beverages.pdf");

    expect(result.stats.categoriesFound).toBeGreaterThan(3);
    expect(result.stats.itemsFound).toBeGreaterThan(10);

    const names = result.categories.flatMap((c) => c.items.map((i) => i.nameGr.toLowerCase()));
    expect(names).toContain("ούζο");
    expect(names.some((n) => n.includes("espresso martini"))).toBe(true);
  });
});
