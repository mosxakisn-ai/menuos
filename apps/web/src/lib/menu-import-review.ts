import {
  isLatinOnlyMenuText,
  type MenuPdfParseResult,
  type ParsedMenuCategoryDraft,
  type ParsedMenuItemDraft,
} from "@menuos/shared";

export type MenuImportIssueSeverity = "error" | "warning" | "info";

export type MenuImportIssue = {
  id: string;
  severity: MenuImportIssueSeverity;
  message: string;
  hint?: string;
};

export type MenuImportReviewReport = {
  totals: {
    categoriesFound: number;
    categoriesWithItems: number;
    emptyCategories: number;
    categoriesSelected: number;
    itemsFound: number;
    itemsSelected: number;
    withPrice: number;
    withoutPrice: number;
    itemsWithWarnings: number;
    categoriesWithWarnings: number;
  };
  issues: MenuImportIssue[];
  canImport: boolean;
};

export function countSelectedImport(draft: MenuPdfParseResult): {
  categories: number;
  items: number;
} {
  const categories = draft.categories.filter((c) => c.selected && c.items.some((i) => i.selected)).length;
  const items = draft.categories
    .filter((c) => c.selected)
    .flatMap((c) => c.items.filter((i) => i.selected)).length;
  return { categories, items };
}

export function buildMenuImportReviewReport(
  draft: MenuPdfParseResult,
  copy: {
    issueNoItems: string;
    issueNoItemsHint: string;
    issueNoPrice: (n: number) => string;
    issueNoPriceHint: string;
    issueEmptyCategories: (n: number) => string;
    issueEmptyCategoriesHint: string;
    issueDuplicateCategories: (n: number) => string;
    issueItemWarnings: (n: number) => string;
    issueItemWarningsHint: string;
    issueNothingSelected: string;
    issueNothingSelectedHint: string;
    issueOcr: string;
    issueOcrHint: string;
  },
  ocrPagesUsed = 0,
): MenuImportReviewReport {
  const categories = draft.categories;
  const allItems = categories.flatMap((c) => c.items);
  const selected = countSelectedImport(draft);
  const emptyCategories = categories.filter((c) => c.items.length === 0);
  const withoutPrice = allItems.filter((i) => i.price === null || i.price === undefined);
  const itemsWithWarnings = allItems.filter((i) => i.warnings.length > 0);
  const categoriesWithWarnings = categories.filter((c) => c.warnings.length > 0);
  const categoriesWithItems = categories.filter((c) => c.items.length > 0);

  const issues: MenuImportIssue[] = [];

  for (const w of draft.warnings) {
    issues.push({
      id: `global-${w.slice(0, 40)}`,
      severity: w.includes("Δεν βρέθηκαν") || w.includes("not found") ? "error" : "warning",
      message: w,
    });
  }

  if (ocrPagesUsed > 0) {
    issues.push({
      id: "ocr",
      severity: "info",
      message: copy.issueOcr,
      hint: copy.issueOcrHint,
    });
  }

  if (draft.stats.itemsFound === 0) {
    issues.push({
      id: "no-items",
      severity: "error",
      message: copy.issueNoItems,
      hint: copy.issueNoItemsHint,
    });
  }

  if (withoutPrice.length > 0) {
    issues.push({
      id: "no-price",
      severity: "warning",
      message: copy.issueNoPrice(withoutPrice.length),
      hint: copy.issueNoPriceHint,
    });
  }

  if (emptyCategories.length > 0) {
    issues.push({
      id: "empty-categories",
      severity: "info",
      message: copy.issueEmptyCategories(emptyCategories.length),
      hint: copy.issueEmptyCategoriesHint,
    });
  }

  if (categoriesWithWarnings.length > 0) {
    issues.push({
      id: "category-warnings",
      severity: "warning",
      message: copy.issueDuplicateCategories(categoriesWithWarnings.length),
    });
  }

  if (itemsWithWarnings.length > 0) {
    issues.push({
      id: "item-warnings",
      severity: "warning",
      message: copy.issueItemWarnings(itemsWithWarnings.length),
      hint: copy.issueItemWarningsHint,
    });
  }

  if (draft.stats.itemsFound > 0 && selected.items === 0) {
    issues.push({
      id: "nothing-selected",
      severity: "error",
      message: copy.issueNothingSelected,
      hint: copy.issueNothingSelectedHint,
    });
  }

  const hasBlockingError = issues.some((i) => i.severity === "error");

  return {
    totals: {
      categoriesFound: categories.length,
      categoriesWithItems: categoriesWithItems.length,
      emptyCategories: emptyCategories.length,
      categoriesSelected: selected.categories,
      itemsFound: draft.stats.itemsFound,
      itemsSelected: selected.items,
      withPrice: draft.stats.itemsWithPrice,
      withoutPrice: draft.stats.itemsFound - draft.stats.itemsWithPrice,
      itemsWithWarnings: itemsWithWarnings.length,
      categoriesWithWarnings: categoriesWithWarnings.length,
    },
    issues,
    canImport: !hasBlockingError && selected.items > 0,
  };
}

function normalizeBilingualFields(nameGr: string, nameEn?: string): { nameGr: string; nameEn?: string } {
  const gr = nameGr.trim();
  if (!gr) return { nameGr: gr, nameEn: nameEn?.trim() || undefined };

  if (isLatinOnlyMenuText(gr)) {
    return { nameGr: gr, nameEn: (nameEn?.trim() || gr).trim() };
  }

  const en = nameEn?.trim();
  if (en && en.toLowerCase() !== gr.toLowerCase()) {
    return { nameGr: gr, nameEn: en };
  }
  return { nameGr: gr, nameEn: undefined };
}

export function countLatinOnlyImportNames(draft: MenuPdfParseResult): {
  total: number;
  latinOnly: number;
} {
  let total = 0;
  let latinOnly = 0;

  for (const cat of draft.categories) {
    if (cat.nameGr.trim()) {
      total += 1;
      if (isLatinOnlyMenuText(cat.nameGr)) latinOnly += 1;
    }
    for (const item of cat.items) {
      if (!item.nameGr.trim()) continue;
      total += 1;
      if (isLatinOnlyMenuText(item.nameGr)) latinOnly += 1;
    }
  }

  return { total, latinOnly };
}

/** English-only / Latin OCR menus need Gemini to fill Greek names before import. */
export function importDraftNeedsGreekTranslation(draft: MenuPdfParseResult): boolean {
  const { total, latinOnly } = countLatinOnlyImportNames(draft);
  return total >= 3 && latinOnly / total >= 0.5;
}

/** Any Latin-only names — show manual translate even on mixed menus. */
export function draftHasLatinOnlyNames(draft: MenuPdfParseResult): boolean {
  return countLatinOnlyImportNames(draft).latinOnly > 0;
}

export function classifyImportTranslationWarnings(warnings: string[]): {
  failed?: string;
  partial?: string;
} {
  let failed: string | undefined;
  let partial: string | undefined;
  for (const w of warnings) {
    if (
      !failed &&
      (w.includes("Μετάφραση AI δεν ολοκληρώθηκε") || w.includes("AI translation did not complete"))
    ) {
      failed = w;
    }
    if (!partial && (w.startsWith("Μερική μετάφραση") || w.startsWith("Partial translation"))) {
      partial = w;
    }
  }
  return { failed, partial };
}

export function normalizeImportDraft(draft: MenuPdfParseResult): MenuPdfParseResult {
  return {
    ...draft,
    categories: draft.categories.map((cat) => {
      const names = normalizeBilingualFields(cat.nameGr, cat.nameEn);
      return {
        ...cat,
        selected: cat.items.length > 0 ? cat.selected : false,
        ...names,
        items: cat.items.map((item) => ({
          ...item,
          ...normalizeBilingualFields(item.nameGr, item.nameEn),
        })),
      };
    }),
  };
}

export function categoryHasIssues(cat: ParsedMenuCategoryDraft): boolean {
  if (cat.warnings.length > 0) return true;
  return cat.items.some((i) => i.warnings.length > 0 || i.price === null);
}

export function itemHasIssues(item: ParsedMenuItemDraft): boolean {
  return item.warnings.length > 0 || item.price === null;
}

export function patchAllItems(
  draft: MenuPdfParseResult,
  patch: Partial<ParsedMenuItemDraft>,
  filter?: (item: ParsedMenuItemDraft, cat: ParsedMenuCategoryDraft) => boolean,
): MenuPdfParseResult {
  return {
    ...draft,
    categories: draft.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) =>
        !filter || filter(item, cat) ? { ...item, ...patch } : item,
      ),
    })),
  };
}
