import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseMenuTextFromPdf, resetMenuPdfParserIds } from "./menu-pdf-parser";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const beverageFixture = readFileSync(
  join(fixtureDir, "menu-pdf-parser.beverage.fixture.txt"),
  "utf8",
);

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
