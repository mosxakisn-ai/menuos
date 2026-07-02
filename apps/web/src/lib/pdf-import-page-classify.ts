/** Shared PDF page classification for import wizard + CLI simulation. */

export type PdfPageKind = "digital" | "scan" | "cover";

const MIN_DIGITAL_CHARS = 50;
const COVER_MAX_CHARS = 25;

export function classifyPdfImportPage(
  textLength: number,
  pageNumber: number,
  totalPages: number,
): { kind: PdfPageKind; selected: boolean } {
  if (pageNumber === 1 && totalPages > 1 && textLength < COVER_MAX_CHARS) {
    return { kind: "cover", selected: false };
  }

  if (pageNumber === totalPages && totalPages > 1 && textLength < COVER_MAX_CHARS) {
    return { kind: "cover", selected: false };
  }

  if (pageNumber === 1 && textLength < MIN_DIGITAL_CHARS) {
    return { kind: "cover", selected: false };
  }

  if (textLength < MIN_DIGITAL_CHARS) {
    return { kind: "scan", selected: true };
  }

  return { kind: "digital", selected: true };
}

export function ensureAnalyzablePageSelection<T extends { kind: PdfPageKind; selected: boolean }>(
  pages: T[],
): T[] {
  if (pages.some((p) => p.selected)) return pages;
  return pages.map((p) => ({ ...p, kind: "scan", selected: true }));
}

export function selectMenuImportPages<T extends { kind: PdfPageKind; selected: boolean }>(
  pages: T[],
): T[] {
  return pages.map((p) => ({
    ...p,
    selected: p.kind === "digital" || p.kind === "scan",
  }));
}
