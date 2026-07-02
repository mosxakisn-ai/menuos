import { getDashboardCopy, type DashboardLang } from "@/content/dashboard-i18n";
import { isOcrSpaceConfigured, ocrImageBuffer, OcrSpaceError } from "@/lib/ocr-space";
import { renderPdfPageToJpeg } from "@/lib/pdf-page-render";
import {
  finalizePdfImportPipeline,
  type PdfImportExtractionMeta,
  type PdfImportPipelineResult,
} from "@/lib/pdf-import-pipeline";
import { enhancePdfImportWithVision, type PdfImportFileContext } from "@/lib/pdf-import-vision";
import { enhancePdfImportWithTranslation } from "@/lib/pdf-import-translate";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_TEXT_CHARS = 15;

export class PdfTextExtractionError extends Error {
  constructor(
    message: string,
    readonly fileName?: string,
  ) {
    super(message);
    this.name = "PdfTextExtractionError";
  }
}

type TableResultLike = {
  pages: Array<{ tables: string[][][] }>;
};

function scoreMenuText(text: string): number {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const withPrice = lines.filter((l) => /\d{1,4}[.,]\d{0,2}\s*€?/u.test(l)).length;
  const withTab = lines.filter((l) => l.includes("\t")).length;
  return lines.length * 40 + text.length + withPrice * 25 + withTab * 15;
}

function pickBestMenuText(candidates: string[]): string {
  const unique = [...new Set(candidates.map((t) => t.trim()).filter((t) => t.length > 0))];
  if (unique.length === 0) return "";
  return unique.sort((a, b) => scoreMenuText(b) - scoreMenuText(a))[0]!;
}

function tablesToText(tableResult: TableResultLike): string {
  const lines: string[] = [];
  for (const page of tableResult.pages) {
    for (const table of page.tables) {
      for (const row of table) {
        const cells = row.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
        if (cells.length === 0) continue;
        if (cells.length === 1) {
          lines.push(cells[0]!);
        } else {
          lines.push(cells.join("\t"));
        }
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

/** Key: `${fileIndex}:${fileName}` or legacy `fileName` only */
export type PageSelectionMap = Record<string, number[]>;

function resolveSelectedPages(
  fileIndex: number,
  fileName: string,
  pageSelections?: PageSelectionMap,
): number[] | undefined {
  if (!pageSelections) return undefined;
  const keyed = pageSelections[`${fileIndex}:${fileName}`];
  if (keyed?.length) return keyed;
  return pageSelections[fileName];
}

async function createPdfParser(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  return new PDFParse({ data: new Uint8Array(buffer) });
}

export async function extractTextFromPdfBuffer(buffer: Buffer, pages?: number[]): Promise<string> {
  const parser = await createPdfParser(buffer);
  const partial = pages && pages.length > 0 ? pages : undefined;
  const candidates: string[] = [];

  try {
    const primary = await parser.getText({
      cellSeparator: "\t",
      lineEnforce: true,
      pageJoiner: "\n",
      ...(partial ? { partial } : {}),
    });
    if (primary.text?.trim()) candidates.push(primary.text.trim());

    if ((primary.text?.trim().length ?? 0) < 120) {
      const loose = await parser.getText({
        lineEnforce: false,
        pageJoiner: "\n",
        ...(partial ? { partial } : {}),
      });
      if (loose.text?.trim()) candidates.push(loose.text.trim());
    }

    if (!partial) {
      try {
        const tables = await parser.getTable();
        const tableText = tablesToText(tables);
        if (tableText.length > 0) candidates.push(tableText);
      } catch (tableErr) {
        console.warn("pdf-extract getTable skipped", tableErr);
      }
    }
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  return pickBestMenuText(candidates);
}

async function extractTextForPage(
  buffer: Buffer,
  pageNumber: number,
  fileName: string,
): Promise<{ text: string; usedOcr: boolean }> {
  let text = await extractTextFromPdfBuffer(buffer, [pageNumber]);
  if (text.length >= MIN_TEXT_CHARS) {
    return { text, usedOcr: false };
  }

  if (!isOcrSpaceConfigured()) {
    return { text: "", usedOcr: false };
  }

  try {
    const jpeg = await renderPdfPageToJpeg(buffer, pageNumber);
    text = await ocrImageBuffer(jpeg, `${fileName}-p${pageNumber}.jpg`);
    return { text, usedOcr: true };
  } catch (err) {
    console.warn("pdf-extract OCR page", fileName, pageNumber, err);
    return { text: "", usedOcr: true };
  }
}

async function extractSelectedPagesText(
  buffer: Buffer,
  fileName: string,
  selectedPages?: number[],
): Promise<{ text: string; ocrPages: number; digitalPages: number; ocrPageNumbers: number[] }> {
  if (!selectedPages || selectedPages.length === 0) {
    const text = await extractTextFromPdfBuffer(buffer);
    const pageCount = text.length >= MIN_TEXT_CHARS ? 1 : 0;
    return { text, ocrPages: 0, digitalPages: pageCount, ocrPageNumbers: [] };
  }

  const parts: string[] = [];
  let ocrPages = 0;
  let digitalPages = 0;
  const ocrPageNumbers: number[] = [];

  for (const pageNum of selectedPages) {
    const { text, usedOcr } = await extractTextForPage(buffer, pageNum, fileName);
    if (usedOcr) {
      ocrPages += 1;
      ocrPageNumbers.push(pageNum);
    } else if (text.trim().length >= MIN_TEXT_CHARS) {
      digitalPages += 1;
    }
    if (text.trim().length >= MIN_TEXT_CHARS) {
      parts.push(text.trim());
    }
  }

  return { text: parts.join("\n\n"), ocrPages, digitalPages, ocrPageNumbers };
}

export function readPdfFilesFromFormData(formData: FormData): File[] {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    const single = formData.get("file");
    if (single instanceof File) return [single];
  }
  return files;
}

export function validatePdfUploadFiles(files: File[], lang: DashboardLang = "EN"): string | null {
  const P = getDashboardCopy(lang).api.pdf;
  if (files.length === 0) return P.noFiles;
  if (files.length > MAX_FILES) return P.tooMany(MAX_FILES);

  for (const file of files) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return P.notPdf(file.name);
    }
    if (file.size > MAX_BYTES) {
      return P.tooLarge(file.name);
    }
  }

  return null;
}

export function parsePageSelectionMap(raw: unknown): PageSelectionMap | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const map: PageSelectionMap = {};
    for (const [fileName, pages] of Object.entries(parsed)) {
      if (!Array.isArray(pages)) continue;
      const nums = pages.filter((p): p is number => typeof p === "number" && p >= 1);
      if (nums.length > 0) map[fileName] = [...new Set(nums)].sort((a, b) => a - b);
    }
    return Object.keys(map).length > 0 ? map : undefined;
  } catch {
    return undefined;
  }
}

export async function parseUploadedPdfFiles(
  files: File[],
  pageSelections?: PageSelectionMap,
  lang: DashboardLang = "EN",
  options?: { forceVision?: boolean; forceTranslate?: boolean },
): Promise<PdfImportPipelineResult> {
  const P = getDashboardCopy(lang).api.pdf;
  const extracted: { name: string; text: string }[] = [];
  const fileContexts: PdfImportFileContext[] = [];
  let totalOcrPages = 0;
  let totalDigitalPages = 0;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex]!;
    const selectedPages = resolveSelectedPages(fileIndex, file.name, pageSelections);
    if (pageSelections && (!selectedPages || selectedPages.length === 0)) {
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    let ocrPages = 0;
    let digitalPages = 0;
    let ocrPageNumbers: number[] = [];

    try {
      const result = await extractSelectedPagesText(buffer, file.name, selectedPages);
      text = result.text;
      ocrPages = result.ocrPages;
      digitalPages = result.digitalPages;
      ocrPageNumbers = result.ocrPageNumbers;
    } catch (err) {
      console.error("pdf-extract", file.name, err);
      const detail = err instanceof Error ? err.message : String(err);
      throw new PdfTextExtractionError(
        detail.includes(file.name) ? detail : P.readFailed(file.name),
        file.name,
      );
    }

    totalOcrPages += ocrPages;
    totalDigitalPages += digitalPages;

    if (text.length < MIN_TEXT_CHARS) {
      const pageHint = selectedPages?.length ? P.pagesHint(selectedPages) : "";
      const ocrHint = isOcrSpaceConfigured() ? P.ocrNoText : P.ocrNotConfigured;
      throw new PdfTextExtractionError(P.noText(file.name, pageHint, ocrHint), file.name);
    }

    extracted.push({ name: file.name, text });
    if (ocrPageNumbers.length > 0) {
      fileContexts.push({ name: file.name, buffer, ocrPageNumbers });
    }
  }

  if (extracted.length === 0) {
    throw new PdfTextExtractionError(
      isOcrSpaceConfigured() ? P.noPagesSelectedOcr : P.noPagesSelectedNoOcr,
    );
  }

  const rulesResult = finalizePdfImportPipeline(extracted, {
    digitalPages: totalDigitalPages,
    ocrPages: totalOcrPages,
  });

  const withVision = await enhancePdfImportWithVision(rulesResult, fileContexts, options);
  return enhancePdfImportWithTranslation(withVision, options);
}

export type { PdfImportExtractionMeta, PdfImportPipelineResult };

export { OcrSpaceError };
