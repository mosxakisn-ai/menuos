export type ParsedMenuItemDraft = {
  id: string;
  nameGr: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  price: number | null;
  descriptionGr?: string;
  warnings: string[];
  selected: boolean;
  sourceFile?: string;
};

export type ParsedMenuCategoryDraft = {
  id: string;
  nameGr: string;
  nameEn?: string;
  nameDe?: string;
  nameFr?: string;
  items: ParsedMenuItemDraft[];
  warnings: string[];
  selected: boolean;
  sourceFile?: string;
};

export type MenuPdfParseResult = {
  categories: ParsedMenuCategoryDraft[];
  warnings: string[];
  stats: {
    filesProcessed: number;
    totalLines: number;
    categoriesFound: number;
    itemsFound: number;
    itemsWithPrice: number;
  };
};

const PRICE_PATTERNS: RegExp[] = [
  /^(.+?)\s+[\.\u00B7·\-–—]{2,}\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu,
  /^(.+?)\s{2,}(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu,
  /^(.+?)\s*[-–—]\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu,
  /^(.+?)\s+(\d{1,4}(?:[.,]\d{1,2})?)\s*€\s*$/iu,
  /^(.+?)\s+€\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*$/iu,
  /^(.+?)\s+(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)\s*$/iu,
  /^(.+?)\t(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu,
];

const PRICE_ONLY = /^(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu;

const SKIP_LINE =
  /^(page\s+\d+|σελίδα\s+\d+|\d+\s*\/\s*\d+|menu\s*#?\d*|www\.|http|tel:|email:|@)/i;

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function resetMenuPdfParserIds() {
  idCounter = 0;
}

function normalizePrice(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > 9999) return null;
  return Math.round(value * 100) / 100;
}

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").replace(/^[\d.)]+\s*/, "").trim();
}

function isMostlyLatin(text: string): boolean {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const greek = (text.match(/[\u0370-\u03FF]/g) ?? []).length;
  return latin > greek && latin >= 3;
}

function looksLikeCategory(line: string, nextLineHasPrice: boolean): boolean {
  if (line.length < 2 || line.length > 80) return false;
  if (extractItemFromLine(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (SKIP_LINE.test(line)) return false;

  const upperRatio =
    (line.match(/[A-ZΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? []).length / Math.max(line.length, 1);
  const titleLike = upperRatio > 0.6 || /^[A-ZΑ-ΩΆΈΉΊΌΎΏ]/.test(line);

  return titleLike || nextLineHasPrice;
}

function extractItemFromLine(line: string): { name: string; price: number | null } | null {
  for (const pattern of PRICE_PATTERNS) {
    const match = line.match(pattern);
    if (!match) continue;
    const name = cleanLine(match[1] ?? "");
    const price = normalizePrice(match[2] ?? "");
    if (name.length >= 2) return { name, price };
  }
  return null;
}

function looksLikeNameOnlyItem(line: string): boolean {
  if (line.length < 2 || line.length > 100) return false;
  if (extractItemFromLine(line)) return false;
  if (SKIP_LINE.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  const stripped = line.replace(/^[-•●▪*]\s*/, "").trim();
  if (stripped.length < 2) return false;
  if (/^(all\s*inclusive|beverages|ποτά|drinks?)$/i.test(stripped)) return false;
  return true;
}

function itemWarnings(name: string, price: number | null): string[] {
  const warnings: string[] = [];
  if (price === null) warnings.push("Λείπει τιμή — συμπλήρωσέ την πριν την εισαγωγή.");
  if (name.length < 3) warnings.push("Πολύ σύντομο όνομα.");
  if (price !== null && price > 500) warnings.push("Ύψηλη τιμή — έλεγξε αν είναι σωστή.");
  return warnings;
}

export function parseMenuTextFromPdf(text: string, sourceFile?: string): MenuPdfParseResult {
  const rawLines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 0 && !SKIP_LINE.test(line));

  const categories: ParsedMenuCategoryDraft[] = [];
  const globalWarnings: string[] = [];
  let currentCategory: ParsedMenuCategoryDraft | null = null;
  let itemsFound = 0;
  let itemsWithPrice = 0;

  function ensureCategory(nameGr: string) {
    const existing = categories.find(
      (c) => c.nameGr.toLowerCase() === nameGr.toLowerCase() && c.sourceFile === sourceFile,
    );
    if (existing) {
      currentCategory = existing;
      return;
    }
    currentCategory = {
      id: nextId("cat"),
      nameGr,
      nameEn: isMostlyLatin(nameGr) ? nameGr : undefined,
      items: [],
      warnings: [],
      selected: true,
      sourceFile,
    };
    categories.push(currentCategory);
  }

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i]!;
    const nextLine = rawLines[i + 1];
    const nextHasPrice = nextLine ? Boolean(extractItemFromLine(nextLine)) : false;

    // Name on one line, price alone on next (common in column layouts)
    if (nextLine) {
      const priceOnly = nextLine.match(PRICE_ONLY);
      if (priceOnly && !extractItemFromLine(line) && line.length >= 3 && !looksLikeCategory(line, true)) {
        const price = normalizePrice(priceOnly[1] ?? "");
        if (price !== null) {
          if (!currentCategory) ensureCategory("Γενικά");
          itemsFound += 1;
          itemsWithPrice += 1;
          currentCategory!.items.push({
            id: nextId("item"),
            nameGr: isMostlyLatin(line) ? line : line,
            nameEn: isMostlyLatin(line) ? line : undefined,
            price,
            warnings: itemWarnings(line, price),
            selected: true,
            sourceFile,
          });
          i += 1;
          continue;
        }
      }
    }

    const item = extractItemFromLine(line);

    if (item) {
      if (!currentCategory) ensureCategory("Γενικά");

      const nameGr = isMostlyLatin(item.name) ? item.name : item.name;
      const nameEn = isMostlyLatin(item.name) ? item.name : undefined;
      const warnings = itemWarnings(nameGr, item.price);
      if (item.price !== null) itemsWithPrice += 1;
      itemsFound += 1;

      currentCategory!.items.push({
        id: nextId("item"),
        nameGr: isMostlyLatin(item.name) ? item.name : item.name,
        nameEn,
        price: item.price,
        warnings,
        selected: item.price !== null,
        sourceFile,
      });
      continue;
    }

    if (looksLikeCategory(line, nextHasPrice)) {
      ensureCategory(line);
      continue;
    }

    if (looksLikeNameOnlyItem(line)) {
      if (!currentCategory) ensureCategory("Γενικά");
      itemsFound += 1;
      itemsWithPrice += 1;
      currentCategory!.items.push({
        id: nextId("item"),
        nameGr: line.replace(/^[-•●▪*]\s*/, "").trim(),
        nameEn: isMostlyLatin(line) ? line.replace(/^[-•●▪*]\s*/, "").trim() : undefined,
        price: 0,
        warnings: ["Χωρίς τιμή στο PDF — βάλαμε €0 (άλλαξέ το αν χρειάζεται)."],
        selected: true,
        sourceFile,
      });
    }
  }

  for (const cat of categories) {
    const names = cat.items.map((i) => i.nameGr.toLowerCase());
    const dupes = names.filter((n, idx) => names.indexOf(n) !== idx);
    if (dupes.length > 0) {
      cat.warnings.push("Υπάρχουν διπλότυπα πιάτα — έλεγξέ τα.");
    }
    if (cat.items.length === 0) {
      cat.warnings.push("Η κατηγορία δεν έχει πιάτα.");
      cat.selected = false;
    }
  }

  if (categories.length === 0) {
    globalWarnings.push(
      "Δεν βρέθηκαν κατηγορίες/πιάτα. Αν το PDF είναι σαρωμένη εικόνα, χρειάζεται digital PDF ή χειροκίνητη εισαγωγή.",
    );
  }

  if (itemsFound > 0 && itemsWithPrice / itemsFound < 0.5) {
    globalWarnings.push(
      "Πολλά πιάτα χωρίς τιμή — έλεγξε τον πίνακα πριν την εισαγωγή.",
    );
  }

  return {
    categories,
    warnings: globalWarnings,
    stats: {
      filesProcessed: 1,
      totalLines: rawLines.length,
      categoriesFound: categories.length,
      itemsFound,
      itemsWithPrice,
    },
  };
}

export function mergeMenuPdfParseResults(results: MenuPdfParseResult[]): MenuPdfParseResult {
  const categories = results.flatMap((r) => r.categories);
  const warnings = results.flatMap((r) => r.warnings);
  const stats = results.reduce(
    (acc, r) => ({
      filesProcessed: acc.filesProcessed + r.stats.filesProcessed,
      totalLines: acc.totalLines + r.stats.totalLines,
      categoriesFound: acc.categoriesFound + r.stats.categoriesFound,
      itemsFound: acc.itemsFound + r.stats.itemsFound,
      itemsWithPrice: acc.itemsWithPrice + r.stats.itemsWithPrice,
    }),
    {
      filesProcessed: 0,
      totalLines: 0,
      categoriesFound: 0,
      itemsFound: 0,
      itemsWithPrice: 0,
    },
  );

  return { categories, warnings, stats };
}

export function parseMultipleMenuPdfTexts(
  files: { name: string; text: string }[],
): MenuPdfParseResult {
  resetMenuPdfParserIds();
  const results = files.map((file) => {
    const parsed = parseMenuTextFromPdf(file.text, file.name);
    parsed.stats.filesProcessed = 1;
    if (parsed.stats.itemsFound === 0 && file.text.trim().length < 40) {
      parsed.warnings.push(
        `Το «${file.name}» φαίνεται κενό ή σαρωμένο — δοκίμασε άλλο PDF.`,
      );
    }
    return parsed;
  });
  return mergeMenuPdfParseResults(results);
}
