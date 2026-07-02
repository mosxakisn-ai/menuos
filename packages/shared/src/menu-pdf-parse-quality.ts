import type { MenuPdfParseResult } from "./menu-pdf-parser";

export type MenuImportParseQuality = {
  /** Share of lines/items that have a price (0–1). */
  priceLineRatio: number;
  /** Categories with items divided by total items — high values suggest OCR noise. */
  categoryToItemRatio: number;
  emptyCategoryCount: number;
  /** Overall parse confidence (0–1). */
  confidence: number;
  /** True when layout/OCR quality is low enough that vision would help. */
  suggestsVision: boolean;
};

export function assessMenuParseQuality(result: MenuPdfParseResult): MenuImportParseQuality {
  const { categories, stats } = result;
  const catsWithItems = categories.filter((c) => c.items.length > 0);
  const emptyCategoryCount = categories.length - catsWithItems.length;

  const categoryToItemRatio =
    stats.itemsFound > 0 ? catsWithItems.length / stats.itemsFound : catsWithItems.length > 0 ? 1 : 0;

  const priceLineRatio = stats.itemsFound > 0 ? stats.itemsWithPrice / stats.itemsFound : 0;

  let confidence = 0.88;
  if (categoryToItemRatio > 0.2) confidence -= 0.12;
  if (categoryToItemRatio > 0.28) confidence -= 0.18;
  if (categoryToItemRatio > 0.38) confidence -= 0.12;
  if (emptyCategoryCount > 3) confidence -= 0.08;
  if (emptyCategoryCount > 8) confidence -= 0.1;
  if (priceLineRatio < 0.75) confidence -= 0.12;
  if (priceLineRatio < 0.5) confidence -= 0.1;
  if (stats.itemsFound < 5) confidence -= 0.15;
  if (stats.categoriesFound === 0 && stats.itemsFound === 0) confidence = 0.1;

  confidence = Math.max(0, Math.min(1, confidence));

  const suggestsVision =
    confidence < 0.62 ||
    categoryToItemRatio > 0.28 ||
    (emptyCategoryCount > 5 && stats.itemsFound > 20);

  return {
    priceLineRatio: Math.round(priceLineRatio * 100) / 100,
    categoryToItemRatio: Math.round(categoryToItemRatio * 100) / 100,
    emptyCategoryCount,
    confidence: Math.round(confidence * 100) / 100,
    suggestsVision,
  };
}
