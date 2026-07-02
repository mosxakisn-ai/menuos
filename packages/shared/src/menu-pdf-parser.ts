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

/** Fallback category when OCR cannot match a section header. */
export const PDF_IMPORT_UNCATEGORIZED_CATEGORY = "Είδη χωρίς κατηγορία";

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
  /^(.+?)\s+(\d{1,4}[.,]\d{1,2})\s*$/iu,
];

const PRICE_ONLY = /^(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:€|EUR)?\s*$/iu;

function isPriceOnlyLine(line: string): boolean {
  return PRICE_ONLY.test(line.trim());
}

function lineHasExtractablePrice(line: string): boolean {
  return extractAllItemsFromLine(line).length > 0 || extractItemFromLine(line)?.price != null;
}

const SKIP_LINE =
  /^(page\s+\d+|σελίδα\s+\d+|\d+\s*\/\s*\d+|menu\s*#?\d*|www\.|http|tel:|email:|@|--\s*\d+\s+of\s+\d+\s*--)/i;

const SKIP_HEADER =
  /^(all[\s-]*inclusive|all\s*beverages|beverages\s*list|legend|notes?|allerg|general\s*information|hotel\s*guide|room\s*service\s*hours|opening\s*hours|copyright|©)/i;

/** Instruction / footer lines — not menu items. */
const SKIP_NOTE =
  /^(choice of|please let us know|with spoon sweet|served with|according to seasonality|ask for availability|types of fish|children menu|vegetarian menu|max \d+ years|for \d+ persons?|επιλογή|παρακαλ|με κουταλάκι|σερβίρεται|ανά εποχικότητα|παιδικό|χορτοφαγικό)/i;

const INLINE_PRICE_RE = /(.+?)\s+(\d{1,4}(?:[.,]\d{1,2})?)\s*€/gi;

function lineHasInlinePrice(line: string): boolean {
  return /\d{1,4}(?:[.,]\d{1,2})?\s*€/.test(line);
}

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
  const normalized = line.replace(/\s+/g, " ").trim();
  // Do not strip leading digits from «9.50€» — OCR often emits prices on their own line.
  if (PRICE_ONLY.test(normalized) || lineHasInlinePrice(normalized)) {
    return normalized;
  }
  return normalized.replace(/^[\d.)]+\s*/, "").trim();
}

function containsGreek(text: string): boolean {
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(text);
}

/** Split «Ελληνικό | English» or «Ελληνικό / English» menu lines. */
export function splitBilingualMenuName(raw: string): { nameGr: string; nameEn?: string } {
  const line = raw.trim();
  if (!line) return { nameGr: line };

  const pipeParts = line.split(/\s*[|¦]\s*/).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length === 2) {
    const [a, b] = pipeParts as [string, string];
    if (containsGreek(a) && !containsGreek(b)) return { nameGr: a, nameEn: b };
    if (containsGreek(b) && !containsGreek(a)) return { nameGr: b, nameEn: a };
  }

  const slash = line.match(/^(.+?)\s*\/\s*(.+)$/u);
  if (slash) {
    const a = slash[1]!.trim();
    const b = slash[2]!.trim();
    // Section headers: «ΣΟΥΠΕΣ / SOUPS» — keep Greek as primary label.
    if (isCapsCategoryHeader(a) || isCapsCategoryHeader(b)) {
      if (containsGreek(a) && !containsGreek(b)) return { nameGr: a, nameEn: b };
      if (containsGreek(b) && !containsGreek(a)) return { nameGr: b, nameEn: a };
      return { nameGr: containsGreek(a) ? a : b };
    }
    if (containsGreek(a) && isMostlyLatin(b)) return { nameGr: a, nameEn: b };
    if (containsGreek(b) && isMostlyLatin(a)) return { nameGr: b, nameEn: a };
  }

  if (isMostlyLatin(line) && !containsGreek(line)) {
    return { nameGr: line };
  }

  return { nameGr: line };
}

function namesFromMenuLine(raw: string): { nameGr: string; nameEn?: string } {
  const names = splitBilingualMenuName(raw);
  return dropDuplicateBilingualName(names);
}

/** Keep PDF text as-is — no duplicate EN when there is no real translation. */
export function dropDuplicateBilingualName(names: {
  nameGr: string;
  nameEn?: string;
}): { nameGr: string; nameEn?: string } {
  if (!names.nameEn) return names;
  if (names.nameEn.trim().toLowerCase() === names.nameGr.trim().toLowerCase()) {
    return { nameGr: names.nameGr };
  }
  return names;
}

function isMostlyLatin(text: string): boolean {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const greek = (text.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) ?? []).length;
  return latin > greek && latin >= 3;
}

/** ALL CAPS section title without price — ΖΥΜΑΡΙΚΑ, ΣΟΥΠΕΣ, PASTA. */
function isCapsCategoryHeader(line: string): boolean {
  const stripped = line.replace(/^[-•●▪*]\s*/, "").trim();
  if (stripped.length < 2 || stripped.length > 55) return false;
  if (lineHasInlinePrice(stripped) || extractItemFromLine(stripped)) return false;
  if (isMenuNoteLine(stripped)) return false;

  const letters = stripped.match(/[A-Za-zΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? [];
  if (letters.length < 2) return false;
  const upper = stripped.match(/[A-ZΑ-ΩΆΈΉΊΌΎΏ]/gu) ?? [];
  return upper.length / letters.length >= 0.85;
}

/** Notes / instructions — skip, never import as items. */
function isMenuNoteLine(line: string): boolean {
  const s = line.trim();
  if (!s || SKIP_NOTE.test(s)) return true;
  if (/\bfor\s+\d+\s+persons?\b/i.test(s) && !lineHasInlinePrice(s)) return true;
  if (/^(please|choice of|served with|according to|ask for)/i.test(s)) return true;
  // Long prose without a price is almost always a footnote.
  if (s.length > 48 && !lineHasInlinePrice(s) && /\b(with|and|our|the|your|σας|με|και)\b/i.test(s)) {
    return true;
  }
  return false;
}

function categoryNamesFromLine(line: string): { nameGr: string; nameEn?: string } {
  const normalized = categoryNameFromLine(line);
  return dropDuplicateBilingualName(splitBilingualMenuName(normalized));
}

function pushMenuItem(
  category: ParsedMenuCategoryDraft,
  nameRaw: string,
  price: number | null,
  sourceFile: string | undefined,
) {
  const names = namesFromMenuLine(nameRaw);
  category.items.push({
    id: nextId("item"),
    nameGr: names.nameGr,
    nameEn: names.nameEn,
    price,
    warnings: itemWarnings(names.nameGr, price),
    selected: true,
    sourceFile,
  });
}

/** OCR table mode merges columns — split «Dish1 7.40€ Dish2 16.00€» into separate lines. */
function expandLinesWithInlinePrices(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    INLINE_PRICE_RE.lastIndex = 0;
    const matches = [...line.matchAll(INLINE_PRICE_RE)];
    if (matches.length >= 2) {
      for (const m of matches) {
        const name = cleanLine(m[1] ?? "");
        const price = m[2];
        if (name.length >= 2) out.push(`${name} ${price}€`);
      }
      continue;
    }
    out.push(line);
  }
  return out;
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
  if (isCapsCategoryHeader(line)) return true;
  if (line.length < 2 || line.length > 80) return false;
  if (extractItemFromLine(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (SKIP_LINE.test(line) || SKIP_HEADER.test(line) || isMenuNoteLine(line)) return false;

  if (line.match(/^(.{2,60}):\s*$/)) return true;
  if (isAllCapsTitle(line)) return true;
  if (isTitleCaseSection(line) && !nextLineHasPrice) return true;

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
  if (name.length < 2 || SKIP_LINE.test(name) || SKIP_HEADER.test(name) || isMenuNoteLine(name)) {
    return null;
  }
  return name;
}

/** All-inclusive / hotel drink lists often omit prices — import short product names only. */
function looksLikeNameOnlyItem(line: string): boolean {
  if (line.length < 2 || line.length > 100) return false;
  if (extractItemFromLine(line)) return false;
  if (extractNumberedItem(line)) return false;
  if (lineHasInlinePrice(line)) return false;
  if (SKIP_LINE.test(line) || SKIP_HEADER.test(line) || isMenuNoteLine(line)) return false;
  if (/^\d+$/.test(line)) return false;
  if (looksLikeCategory(line, false)) return false;

  const stripped = line.replace(/^[-•●▪*]\s*/, "").trim();
  if (stripped.length < 2) return false;
  if (/^\([^)]+\)$/.test(stripped)) return false;
  if (/^(all\s*inclusive|beverages?|ποτά|drinks?)$/i.test(stripped)) return false;

  const commaCount = (stripped.match(/,/g) ?? []).length;
  if (commaCount >= 2) return false;
  if (
    commaCount >= 1 &&
    /\b(juice|soda|sugar|lime|mint|rum|gin|vodka|tequila|orange|lemon|coffee|liqueur|cointreau|grenadine|squash)\b/i.test(
      stripped,
    )
  ) {
    return false;
  }

  const words = stripped.split(/\s+/);
  if (words.length > 8) return false;
  if (
    words.length >= 5 &&
    /\b(with|and|our|the|your|or|με|και|για)\b/i.test(stripped) &&
    !/\d+\s*(cl|ml|oz)\b/i.test(stripped)
  ) {
    return false;
  }

  return true;
}

function extractAllItemsFromLine(line: string): { name: string; price: number }[] {
  INLINE_PRICE_RE.lastIndex = 0;
  const matches = [...line.matchAll(INLINE_PRICE_RE)];
  if (matches.length === 0) {
    const single = extractItemFromLine(line);
    if (single?.price != null) return [{ name: single.name, price: single.price }];
    return [];
  }
  const items: { name: string; price: number }[] = [];
  for (const m of matches) {
    const name = cleanLine(m[1] ?? "");
    const price = normalizePrice(m[2] ?? "");
    if (name.length >= 2 && price != null) items.push({ name, price });
  }
  return items;
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

function isPairingCategoryLine(line: string): boolean {
  const stripped = line.replace(/^[-•●▪*]\s*/, "").trim();
  if (!stripped) return false;
  if (SKIP_HEADER.test(stripped) || SKIP_LINE.test(stripped)) return true;
  if (isCapsCategoryHeader(stripped)) return true;
  if (isAllCapsTitle(stripped) && !lineHasInlinePrice(stripped)) return true;
  return false;
}

/** OCR on 2-column menus often outputs names then a block of price-only lines. */
function pairSeparatedNamePriceLines(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (lineHasExtractablePrice(line)) {
      out.push(line);
      i += 1;
      continue;
    }

    if (isPairingCategoryLine(line)) {
      out.push(line);
      i += 1;
      continue;
    }

    const names: string[] = [];
    while (i < lines.length) {
      const cur = lines[i]!;
      if (isPriceOnlyLine(cur) || lineHasExtractablePrice(cur) || isPairingCategoryLine(cur)) break;
      names.push(cur);
      i += 1;
    }

    const prices: string[] = [];
    while (i < lines.length && isPriceOnlyLine(lines[i]!)) {
      prices.push(lines[i]!);
      i += 1;
    }

    if (names.length > 0 && prices.length > 0) {
      const paired = Math.min(names.length, prices.length);
      for (let k = 0; k < paired; k++) {
        const priceRaw = prices[k]!.match(PRICE_ONLY)?.[1] ?? "";
        out.push(`${names[k]} ${priceRaw}€`);
      }
      for (let k = paired; k < names.length; k++) out.push(names[k]!);
    } else {
      out.push(...names);
    }
  }

  return out;
}

function prepareMenuPdfLines(text: string): string[] {
  const cleaned = preprocessMenuPdfLines(text)
    .map(cleanLine)
    .filter((line) => line.length > 0 && !SKIP_LINE.test(line) && !isMenuNoteLine(line));

  return expandLinesWithInlinePrices(pairSeparatedNamePriceLines(cleaned));
}

/** Restaurant menus with € prices — skip name-only rows (all-inclusive drink lists omit prices). */
function documentExpectsPrices(lines: string[]): boolean {
  let euroLines = 0;
  let decimalPrices = 0;
  for (const line of lines) {
    if (lineHasInlinePrice(line)) euroLines += 1;
    if (extractItemFromLine(line)?.price != null) decimalPrices += 1;
  }
  if (euroLines >= 3) return true;
  if (decimalPrices >= 8) return true;
  return false;
}

function categoryNameFromLine(line: string): string {
  const colon = line.match(/^(.{2,60}):\s*$/);
  if (colon) return colon[1]!.trim();
  return line.replace(/^[-•●▪*]\s*/, "").trim();
}

export function parseMenuTextFromPdf(text: string, sourceFile?: string): MenuPdfParseResult {
  const rawLines = prepareMenuPdfLines(text);
  const expectsPrices = documentExpectsPrices(rawLines);

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
    const catNames = categoryNamesFromLine(normalized);
    currentCategory = {
      id: nextId("cat"),
      nameGr: catNames.nameGr,
      nameEn: catNames.nameEn,
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
    const nextHasPrice = nextLine
      ? isPriceOnlyLine(nextLine) || Boolean(extractItemFromLine(nextLine))
      : false;

    if (isMenuNoteLine(line)) continue;

    if (looksLikeCategory(line, nextHasPrice)) {
      ensureCategory(line);
      continue;
    }

    const inlineItems = extractAllItemsFromLine(line);
    if (inlineItems.length > 0) {
      if (!currentCategory) ensureCategory(PDF_IMPORT_UNCATEGORIZED_CATEGORY);
      for (const entry of inlineItems) {
        itemsFound += 1;
        itemsWithPrice += 1;
        pushMenuItem(currentCategory!, entry.name, entry.price, sourceFile);
      }
      continue;
    }

    if (nextLine) {
      const priceOnly = nextLine.match(PRICE_ONLY);
      if (priceOnly && !extractItemFromLine(line) && line.length >= 3 && !looksLikeCategory(line, true)) {
        const price = normalizePrice(priceOnly[1] ?? "");
        if (price !== null) {
          if (!currentCategory) ensureCategory(PDF_IMPORT_UNCATEGORIZED_CATEGORY);
          itemsFound += 1;
          itemsWithPrice += 1;
          pushMenuItem(currentCategory!, line, price, sourceFile);
          i += 1;
          continue;
        }
      }
    }

    const numbered = extractNumberedItem(line);
    if (numbered) {
      if (!currentCategory) ensureCategory(PDF_IMPORT_UNCATEGORIZED_CATEGORY);
      itemsFound += 1;
      pushMenuItem(currentCategory!, numbered, null, sourceFile);
      continue;
    }

    if (!expectsPrices && looksLikeNameOnlyItem(line)) {
      if (!currentCategory) ensureCategory(PDF_IMPORT_UNCATEGORIZED_CATEGORY);
      itemsFound += 1;
      pushMenuItem(currentCategory!, line.replace(/^[-•●▪*]\s*/, "").trim(), null, sourceFile);
    }
  }

  for (const cat of categories) {
    const names = cat.items.map((i) => i.nameGr.toLowerCase());
    const dupes = names.filter((n, idx) => names.indexOf(n) !== idx);
    if (dupes.length > 0) {
      cat.warnings.push("Υπάρχουν διπλότυπα είδη — έλεγξέ τα.");
    }
    if (cat.items.length === 0) {
      cat.warnings.push("Η κατηγορία δεν έχει είδη.");
      cat.selected = false;
    }
  }

  if (categories.length === 0) {
    globalWarnings.push(
      "Δεν βρέθηκαν κατηγορίες/είδη. Αν το PDF είναι σαρωμένη εικόνα, χρειάζεται OCR ή χειροκίνητη εισαγωγή.",
    );
  }

  const itemsWithoutPrice = itemsFound - itemsWithPrice;
  if (itemsFound > 0 && itemsWithoutPrice > 0) {
    globalWarnings.push(
      itemsWithoutPrice === itemsFound
        ? "Δεν βρέθηκαν τιμές στο PDF — τα είδη εισάγονται χωρίς τιμή (€0). Μπορείς να τις συμπληρώσεις μετά."
        : `${itemsWithoutPrice} είδη χωρίς τιμή — έλεγξέ τα πριν την εισαγωγή.`,
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
