"use client";

import {
  getDashboardCopy,
  type DashboardLang,
} from "@/content/dashboard-i18n";
import {
  classifyPdfImportPage,
  ensureAnalyzablePageSelection,
  type PdfPageKind,
} from "@/lib/pdf-import-page-classify";

export type { PdfPageKind };

export type PdfPagePreview = {
  id: string;
  fileName: string;
  fileIndex: number;
  pageNumber: number;
  totalPages: number;
  thumbnailUrl: string;
  textLength: number;
  kind: PdfPageKind;
  skipReason?: string;
  selected: boolean;
};

export function pageSelectionKey(fileIndex: number, fileName: string): string {
  return `${fileIndex}:${fileName}`;
}

async function getPdfJs() {
  return import("pdfjs-dist/webpack.mjs");
}

async function renderPageThumbnail(
  page: import("pdfjs-dist").PDFPageProxy,
  scale = 0.35,
): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  // pdfjs-dist types disagree across TS/pdfjs versions; canvasContext works at runtime.
  await page.render({ canvasContext: ctx, viewport } as never).promise;
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function pageTextLength(page: import("pdfjs-dist").PDFPageProxy): Promise<number> {
  const content = await page.getTextContent();
  const text = content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length;
}

export async function loadPdfPagePreviews(
  file: File,
  fileIndex: number,
  onProgress?: (current: number, total: number) => void,
  lang: DashboardLang = "EN",
): Promise<PdfPagePreview[]> {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const totalPages = doc.numPages;
  const pages: PdfPagePreview[] = [];

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    onProgress?.(pageNumber, totalPages);
    const page = await doc.getPage(pageNumber);
    const [thumbnailUrl, textLength] = await Promise.all([
      renderPageThumbnail(page),
      pageTextLength(page),
    ]);
    const classified = classifyPdfImportPage(textLength, pageNumber, totalPages);
    const skip = getDashboardCopy(lang).importWizard;
    const skipReason =
      classified.kind === "cover"
        ? pageNumber === 1 && totalPages > 1
          ? skip.skipCoverFirst
          : pageNumber === totalPages && totalPages > 1
            ? skip.skipCoverLast
            : pageNumber === 1
              ? skip.skipBanner
              : skip.skipLowText
        : classified.kind === "scan"
          ? skip.skipScan
          : undefined;
    pages.push({
      id: `${fileIndex}-${pageNumber}`,
      fileName: file.name,
      fileIndex,
      pageNumber,
      totalPages,
      thumbnailUrl,
      textLength,
      kind: classified.kind,
      skipReason,
      selected: classified.selected,
    });
  }

  return pages;
}

export async function loadAllPdfPagePreviews(
  files: File[],
  onProgress?: (fileIndex: number, fileName: string, page: number, totalPages: number) => void,
  lang: DashboardLang = "EN",
): Promise<PdfPagePreview[]> {
  const all: PdfPagePreview[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]!;
    const pages = await loadPdfPagePreviews(
      file,
      i,
      (page, total) => onProgress?.(i, file.name, page, total),
      lang,
    );
    all.push(...pages);
  }
  return ensurePdfPagesAnalyzable(all);
}

/** When every page is image-only, auto-select all for OCR instead of blocking import. */
export function ensurePdfPagesAnalyzable(pages: PdfPagePreview[]): PdfPagePreview[] {
  return ensureAnalyzablePageSelection(pages).map((p) => ({ ...p, skipReason: undefined }));
}

/** All selected menu pages (digital + scan), keyed by file index. */
export function buildPageSelectionMap(pages: PdfPagePreview[]): Record<string, number[]> {
  const map: Record<string, number[]> = {};
  for (const p of pages) {
    if (!p.selected) continue;
    const key = pageSelectionKey(p.fileIndex, p.fileName);
    if (!map[key]) map[key] = [];
    map[key]!.push(p.pageNumber);
  }
  for (const key of Object.keys(map)) {
    map[key]!.sort((a, b) => a - b);
  }
  return map;
}

export function pageSelectionStats(pages: PdfPagePreview[]) {
  const selected = pages.filter((p) => p.selected);
  const digital = selected.filter((p) => p.kind === "digital");
  const scanSelected = selected.filter((p) => p.kind === "scan");
  const scanTotal = pages.filter((p) => p.kind === "scan");
  const coverTotal = pages.filter((p) => p.kind === "cover");
  return {
    selectedCount: selected.length,
    digitalCount: digital.length,
    scanSelectedCount: scanSelected.length,
    scanTotalCount: scanTotal.length,
    coverTotalCount: coverTotal.length,
    canAnalyze: pages.some((p) => p.selected),
  };
}

export function selectMenuPagesOnly(pages: PdfPagePreview[]): PdfPagePreview[] {
  return pages.map((p) => ({
    ...p,
    selected: p.kind === "digital" || p.kind === "scan",
  }));
}
