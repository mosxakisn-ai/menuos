import { describe, expect, it } from "vitest";
import {
  menuImportDocumentToParseResult,
  menuPdfParseResultToDocument,
} from "./menu-import-document";
import {
  normalizeParsedMenuCategories,
  parseMenuTextFromPdf,
  resetMenuPdfParserIds,
  type ParsedMenuCategoryDraft,
} from "./menu-pdf-parser";
import { assessMenuParseQuality } from "./menu-pdf-parse-quality";

describe("menuPdfParseResultToDocument", () => {
  it("round-trips categories and items", () => {
    resetMenuPdfParserIds();
    const parsed = parseMenuTextFromPdf(
      `ΖΥΜΑΡΙΚΑ / PASTA
Κριθαρότο 12.00€
ΜΕΖΕΔΕΣ
Tzatziki 7.40€`,
      "test.pdf",
    );
    const doc = menuPdfParseResultToDocument(parsed, {
      path: "hybrid",
      digitalPages: 1,
      ocrPages: 2,
      confidence: 0.82,
      suggestsVision: false,
    });

    expect(doc.languages).toContain("el");
    expect(doc.sections.length).toBeGreaterThan(0);
    expect(doc.source?.path).toBe("hybrid");

    const back = menuImportDocumentToParseResult(doc);
    expect(back.stats.itemsFound).toBe(parsed.stats.itemsFound);
    expect(back.categories.map((c) => c.nameGr)).toEqual(parsed.categories.map((c) => c.nameGr));
  });
});

describe("normalizeParsedMenuCategories", () => {
  it("merges duplicate Greek sections and drops orphan English headers", () => {
    const cats: ParsedMenuCategoryDraft[] = [
      {
        id: "c1",
        nameGr: "ΜΕΖΕΔΕΣ",
        nameEn: "STARTERS",
        items: [
          {
            id: "i1",
            nameGr: "Tzatziki",
            price: 7.4,
            warnings: [],
            selected: true,
          },
        ],
        warnings: [],
        selected: true,
      },
      {
        id: "c2",
        nameGr: "STARTERS",
        items: [],
        warnings: [],
        selected: false,
      },
      {
        id: "c3",
        nameGr: "PASTA",
        items: [],
        warnings: [],
        selected: false,
      },
      {
        id: "c4",
        nameGr: "ΖΥΜΑΡΙΚΑ",
        nameEn: "PASTA",
        items: [
          {
            id: "i2",
            nameGr: "Κριθαρότο",
            price: 12,
            warnings: [],
            selected: true,
          },
        ],
        warnings: [],
        selected: true,
      },
    ];

    const normalized = normalizeParsedMenuCategories(cats);
    expect(normalized.some((c) => c.nameGr === "PASTA")).toBe(false);
    expect(normalized.some((c) => c.nameGr === "STARTERS" && c.items.length === 0)).toBe(false);
    expect(normalized.find((c) => c.nameGr === "ΜΕΖΕΔΕΣ")?.items).toHaveLength(1);
    expect(normalized.find((c) => c.nameGr === "ΖΥΜΑΡΙΚΑ")?.items).toHaveLength(1);
  });
});

describe("assessMenuParseQuality", () => {
  it("flags noisy OCR with many categories per item", () => {
    const quality = assessMenuParseQuality({
      categories: Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        nameGr: `CAT ${i}`,
        items: [
          {
            id: `i${i}a`,
            nameGr: `Item ${i}a`,
            price: 10,
            warnings: [],
            selected: true,
          },
          {
            id: `i${i}b`,
            nameGr: `Item ${i}b`,
            price: 12,
            warnings: [],
            selected: true,
          },
        ],
        warnings: [],
        selected: true,
      })),
      warnings: [],
      stats: {
        filesProcessed: 1,
        totalLines: 40,
        categoriesFound: 10,
        itemsFound: 20,
        itemsWithPrice: 20,
      },
    });
    expect(quality.suggestsVision).toBe(true);
    expect(quality.confidence).toBeLessThan(0.7);
  });
});
