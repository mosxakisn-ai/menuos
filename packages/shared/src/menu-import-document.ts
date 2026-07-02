import type {
  MenuPdfParseResult,
  ParsedMenuCategoryDraft,
  ParsedMenuItemDraft,
} from "./menu-pdf-parser";
import { resetMenuPdfParserIds, normalizeParsedMenuCategories } from "./menu-pdf-parser";

/** Supported menu languages in import JSON (lowercase ISO-style). */
export type MenuImportLanguage = "el" | "en" | "de" | "fr";

export type MenuImportExtractionPath = "digital" | "ocr" | "hybrid" | "vision";

export type MenuImportItem = {
  name: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  description?: string;
  price: number | null;
  icons?: string[];
  notes?: string[];
  sourceFile?: string;
};

export type MenuImportSection = {
  title: string;
  titleEn?: string;
  titleDe?: string;
  titleFr?: string;
  items: MenuImportItem[];
  sourceFile?: string;
};

/** Canonical intermediate document — shared by rules parser and future vision path. */
export type MenuImportDocument = {
  restaurant?: string;
  languages: MenuImportLanguage[];
  sections: MenuImportSection[];
  source?: {
    path: MenuImportExtractionPath;
    digitalPages?: number;
    ocrPages?: number;
    confidence?: number;
    suggestsVision?: boolean;
  };
};

export type MenuImportDocumentMeta = NonNullable<MenuImportDocument["source"]> & {
  visionPages?: number;
};

function detectLanguages(sections: MenuImportSection[]): MenuImportLanguage[] {
  const langs = new Set<MenuImportLanguage>(["el"]);
  for (const section of sections) {
    if (section.titleEn || section.items.some((i) => i.nameEn)) langs.add("en");
    if (section.titleDe || section.items.some((i) => i.nameDe)) langs.add("de");
    if (section.titleFr || section.items.some((i) => i.nameFr)) langs.add("fr");
  }
  return [...langs];
}

function itemDraftToImportItem(item: ParsedMenuItemDraft): MenuImportItem {
  return {
    name: item.nameGr,
    ...(item.nameEn ? { nameEn: item.nameEn } : {}),
    ...(item.nameDe ? { nameDe: item.nameDe } : {}),
    ...(item.nameFr ? { nameFr: item.nameFr } : {}),
    ...(item.descriptionGr ? { description: item.descriptionGr } : {}),
    price: item.price,
    ...(item.sourceFile ? { sourceFile: item.sourceFile } : {}),
  };
}

function categoryDraftToSection(cat: ParsedMenuCategoryDraft): MenuImportSection {
  return {
    title: cat.nameGr,
    ...(cat.nameEn ? { titleEn: cat.nameEn } : {}),
    ...(cat.nameDe ? { titleDe: cat.nameDe } : {}),
    ...(cat.nameFr ? { titleFr: cat.nameFr } : {}),
    items: cat.items.map(itemDraftToImportItem),
    ...(cat.sourceFile ? { sourceFile: cat.sourceFile } : {}),
  };
}

export function menuPdfParseResultToDocument(
  result: MenuPdfParseResult,
  source?: MenuImportDocumentMeta,
): MenuImportDocument {
  const sections = result.categories
    .filter((c) => c.items.length > 0)
    .map(categoryDraftToSection);

  return {
    languages: detectLanguages(sections),
    sections,
    ...(source ? { source } : {}),
  };
}

function pushMenuItemFromImport(
  category: ParsedMenuCategoryDraft,
  item: MenuImportItem,
  idPrefix: string,
) {
  const draft: ParsedMenuItemDraft = {
    id: `${idPrefix}-item-${category.items.length + 1}`,
    nameGr: item.name,
    ...(item.nameEn ? { nameEn: item.nameEn } : {}),
    ...(item.nameDe ? { nameDe: item.nameDe } : {}),
    ...(item.nameFr ? { nameFr: item.nameFr } : {}),
    ...(item.description ? { descriptionGr: item.description } : {}),
    price: item.price,
    warnings: [],
    selected: true,
    ...(item.sourceFile ? { sourceFile: item.sourceFile } : {}),
  };
  category.items.push(draft);
}

export function menuImportDocumentToParseResult(doc: MenuImportDocument): MenuPdfParseResult {
  resetMenuPdfParserIds();

  const categories: ParsedMenuCategoryDraft[] = [];
  let itemsFound = 0;
  let itemsWithPrice = 0;

  for (let i = 0; i < doc.sections.length; i += 1) {
    const section = doc.sections[i]!;
    if (section.items.length === 0) continue;
    const cat: ParsedMenuCategoryDraft = {
      id: `cat-${i + 1}`,
      nameGr: section.title,
      ...(section.titleEn ? { nameEn: section.titleEn } : {}),
      ...(section.titleDe ? { nameDe: section.titleDe } : {}),
      ...(section.titleFr ? { nameFr: section.titleFr } : {}),
      items: [],
      warnings: [],
      selected: true,
      ...(section.sourceFile ? { sourceFile: section.sourceFile } : {}),
    };

    for (const item of section.items) {
      pushMenuItemFromImport(cat, item, `cat-${i + 1}`);
      itemsFound += 1;
      if (item.price != null) itemsWithPrice += 1;
    }

    categories.push(cat);
  }

  const normalized = normalizeParsedMenuCategories(categories);
  itemsFound = normalized.reduce((n, c) => n + c.items.length, 0);
  itemsWithPrice = normalized.reduce(
    (n, c) => n + c.items.filter((i) => i.price != null).length,
    0,
  );

  return {
    categories: normalized,
    warnings: [],
    stats: {
      filesProcessed: 1,
      totalLines: doc.sections.reduce((n, s) => n + s.items.length, 0),
      categoriesFound: normalized.length,
      itemsFound,
      itemsWithPrice,
    },
  };
}

function normalizeSectionKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Merge consecutive sections with the same title (multi-page vision). */
export function mergeMenuImportSections(
  sections: MenuImportSection[],
  sourceFile?: string,
): MenuImportSection[] {
  const merged: MenuImportSection[] = [];

  for (const section of sections) {
    if (section.items.length === 0) continue;
    const key = normalizeSectionKey(section.title);
    const last = merged[merged.length - 1];
    if (last && normalizeSectionKey(last.title) === key) {
      last.items.push(...section.items);
      if (!last.titleEn && section.titleEn) last.titleEn = section.titleEn;
      continue;
    }
    merged.push({
      ...section,
      items: [...section.items],
      ...(sourceFile ? { sourceFile } : {}),
    });
  }

  return merged;
}
