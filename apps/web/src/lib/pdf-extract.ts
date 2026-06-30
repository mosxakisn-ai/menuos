import type { MenuPdfParseResult } from "@menuos/shared";

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

async function createPdfParser(buffer: Buffer) {
  const { PDFParse } = await import("pdf-parse");
  return new PDFParse({ data: new Uint8Array(buffer) });
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const parser = await createPdfParser(buffer);
  const candidates: string[] = [];

  try {
    const primary = await parser.getText({
      cellSeparator: "\t",
      lineEnforce: true,
      pageJoiner: "",
    });
    if (primary.text?.trim()) candidates.push(primary.text.trim());

    if ((primary.text?.trim().length ?? 0) < 120) {
      const loose = await parser.getText({ lineEnforce: false, pageJoiner: "" });
      if (loose.text?.trim()) candidates.push(loose.text.trim());
    }

    try {
      const tables = await parser.getTable();
      const tableText = tablesToText(tables);
      if (tableText.length > 0) candidates.push(tableText);
    } catch (tableErr) {
      console.warn("pdf-extract getTable skipped", tableErr);
    }
  } finally {
    await parser.destroy().catch(() => undefined);
  }

  return pickBestMenuText(candidates);
}

export function readPdfFilesFromFormData(formData: FormData): File[] {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    const single = formData.get("file");
    if (single instanceof File) return [single];
  }
  return files;
}

export function validatePdfUploadFiles(files: File[]): string | null {
  if (files.length === 0) return "Επίλεξε τουλάχιστον ένα PDF.";
  if (files.length > MAX_FILES) return `Μέγιστο ${MAX_FILES} PDF ανά φορά.`;

  for (const file of files) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return `Το «${file.name}» δεν είναι PDF.`;
    }
    if (file.size > MAX_BYTES) {
      return `Το «${file.name}» είναι πολύ μεγάλο (max 10MB).`;
    }
  }

  return null;
}

export async function parseUploadedPdfFiles(files: File[]): Promise<MenuPdfParseResult> {
  const { parseMultipleMenuPdfTexts } = await import("@menuos/shared");
  const extracted: { name: string; text: string }[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text: string;
    try {
      text = await extractTextFromPdfBuffer(buffer);
    } catch (err) {
      console.error("pdf-extract", file.name, err);
      throw new PdfTextExtractionError(
        `Αδυναμία ανάγνωσης «${file.name}». Το αρχείο μπορεί να είναι κλειδωμένο ή κατεστραμμένο.`,
        file.name,
      );
    }
    if (text.length < MIN_TEXT_CHARS) {
      throw new PdfTextExtractionError(
        `Το «${file.name}» δεν έχει εξαγόμενο κείμενο — συνήθως είναι σαρωμένη εικόνα, όχι digital PDF.`,
        file.name,
      );
    }
    extracted.push({ name: file.name, text });
  }

  return parseMultipleMenuPdfTexts(extracted);
}
