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
  /^(page\s+\d+|σελίδα\s+\d+|\d+\s*\/\s*\d+|menu\s*#?\d*|www\.|http|tel:|email:|@|--\s*\d+\s+of\s+\d+\s*--)/i;

const SKIP_HEADER =
  /^(all[\s-]*inclusive|all\s*beverages|beverages\s*list|legend|notes?|allerg|general\s*information|hotel\s*guide|room\s*service\s*hours|opening\s*hours|copyright|©)/i;

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

function isAllCapsTitle(line: string): boolean {
  const letters = line.match(/[A-Za-zΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? [];
  if (letters.length < 2) return false;
  const upper = line.match(/[A-ZΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? [];
  if (upper.length / letters.length < 0.85) return false;

  const words = line.trim().split(/\s+/);
  if (words.length >= 2) return true;

  return /^(beers?|wines?|cocktails?|spirits?|soft\s*drinks?|coffee|tea|breakfast|lunch|dinner|appetizers?|salads?|desserts?|soups?|mains?|beverages?|drinks?|πρωιν|μεσημ|βραδ|σαλάτ|ποτ|κοκτέιλ|μπύρ|κρασ|αναψυκτ)/i.test(
    line,
  );
}

function isTitleCaseSection(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 8 || line.length > 60) return false;
  return words.every((w) => /^[A-ZΑ-ΩΆΈΉΊΌΎΏ]/.test(w));
}

function looksLikeCategory(line: string, nextLineHasPrice: boolean): boolean {
  if (line.length < 2 || line.length > 80) return false;
  if (extractItemFromLine(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (SKIP_LINE.test(line) || SKIP_HEADER.test(line)) return false;

  if (line.match(/^(.{2,60}):\s*$/)) return true;
  if (isAllCapsTitle(line)) return true;
  if (isTitleCaseSection(line)) return true;

  if (nextLineHasPrice) {
    const upperRatio =
      (line.match(/[A-ZΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? []).length / Math.max(line.length, 1);
    if (upperRatio > 0.6 && line.length <= 40) return true;
  }

  return false;
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

function extractNumberedItem(line: string): string | null {
  const match = line.match(/^\d+[\.)]\s*(.+)$/);
  if (!match) return null;
  const name = cleanLine(match[1] ?? "").replace(/^[-•●▪*]\s*/, "").trim();
  if (name.length < 2 || SKIP_LINE.test(name) || SKIP_HEADER.test(name)) return null;
  return name;
}

function looksLikeNameOnlyItem(line: string): boolean {
  if (line.length < 2 || line.length > 100) return false;
  if (extractItemFromLine(line)) return false;
  if (extractNumberedItem(line)) return false;
  if (SKIP_LINE.test(line) || SKIP_HEADER.test(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (looksLikeCategory(line, false)) return false;
  const stripped = line.replace(/^[-•●▪*]\s*/, "").trim();
  if (stripped.length < 2) return false;
  if (/^(all\s*inclusive|beverages?|ποτά|drinks?)$/i.test(stripped)) return false;
  return true;
}

function itemWarnings(name: string, price: number | null): string[] {
  const warnings: string[] = [];
  if (price === null) warnings.push("Χωρίς τιμή — συμπλήρωσέ την ή άφησε €0.");
  if (name.length < 3) warnings.push("Πολύ σύντομο όνομα.");
  if (price !== null && price > 500) warnings.push("Ύψηλη τιμή — έλεγξε αν είναι σωστή.");
  return warnings;
}

function preprocessMenuPdfLines(text: string): string[] {
  const raw = text.split(/\r?\n/);
  const merged: string[] = [];

  for (const line of raw) {
    const trimmed = line.replace(/\s+/g, " ").trim();
    if (!trimmed) continue;

    const prev = merged[merged.length - 1];
    if (prev && /-\s*$/.test(prev) && /^[a-zα-ωά-ώ]/.test(trimmed)) {
      merged[merged.length - 1] = prev.replace(/-\s*$/, "") + trimmed;
      continue;
    }

    merged.push(trimmed);
  }

  return merged;
}

function categoryNameFromLine(line: string): string {
  const colon = line.match(/^(.{2,60}):\s*$/);
  if (colon) return colon[1]!.trim();
  return line.replace(/^[-•●▪*]\s*/, "").trim();
}

export function parseMenuTextFromPdf(text: string, sourceFile?: string): MenuPdfParseResult {
  const rawLines = preprocessMenuPdfLines(text)
    .map(cleanLine)
    .filter((line) => line.length > 0 && !SKIP_LINE.test(line));

  const categories: ParsedMenuCategoryDraft[] = [];
  const globalWarnings: string[] = [];
  let currentCategory: ParsedMenuCategoryDraft | null = null;
  let itemsFound = 0;
  let itemsWithPrice = 0;

  function ensureCategory(nameGr: string) {
    const normalized = categoryNameFromLine(nameGr);
    if (SKIP_HEADER.test(normalized)) return;
    const existing = categories.find(
      (c) => c.nameGr.toLowerCase() === normalized.toLowerCase() && c.sourceFile === sourceFile,
    );
    if (existing) {
      currentCategory = existing;
      return;
    }
    currentCategory = {
      id: nextId("cat"),
      nameGr: normalized,
      nameEn: isMostlyLatin(normalized) ? normalized : undefined,
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
            nameGr: line,
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

    const numbered = extractNumberedItem(line);
    if (numbered) {
      if (!currentCategory) ensureCategory("Γενικά");
      itemsFound += 1;
      currentCategory!.items.push({
        id: nextId("item"),
        nameGr: numbered,
        nameEn: isMostlyLatin(numbered) ? numbered : undefined,
        price: null,
        warnings: itemWarnings(numbered, null),
        selected: true,
        sourceFile,
      });
      continue;
    }

    const item = extractItemFromLine(line);

    if (item) {
      if (!currentCategory) ensureCategory("Γενικά");

      const nameGr = item.name;
      const nameEn = isMostlyLatin(item.name) ? item.name : undefined;
      const warnings = itemWarnings(nameGr, item.price);
      if (item.price !== null) itemsWithPrice += 1;
      itemsFound += 1;

      currentCategory!.items.push({
        id: nextId("item"),
        nameGr,
        nameEn,
        price: item.price,
        warnings,
        selected: true,
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
      const name = line.replace(/^[-•●▪*]\s*/, "").trim();
      itemsFound += 1;
      currentCategory!.items.push({
        id: nextId("item"),
        nameGr: name,
        nameEn: isMostlyLatin(name) ? name : undefined,
        price: null,
        warnings: itemWarnings(name, null),
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

  const itemsWithoutPrice = itemsFound - itemsWithPrice;
  if (itemsFound > 0 && itemsWithoutPrice > 0) {
    globalWarnings.push(
      itemsWithoutPrice === itemsFound
        ? "Δεν βρέθηκαν τιμές στο PDF — τα πιάτα εισάγονται χωρίς τιμή (€0). Μπορείς να τις συμπληρώσεις μετά."
        : `${itemsWithoutPrice} πιάτα χωρίς τιμή — έλεγξέ τα πριν την εισαγωγή.`,
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
