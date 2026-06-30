import type { MenuPdfParseResult } from "@menuos/shared";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;

export class PdfTextExtractionError extends Error {
  constructor(
    message: string,
    readonly fileName?: string,
  ) {
    super(message);
    this.name = "PdfTextExtractionError";
  }
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text?.trim() ?? "";
  } finally {
    await parser.destroy().catch(() => undefined);
  }
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
    if (text.length < 20) {
      throw new PdfTextExtractionError(
        `Το «${file.name}» δεν έχει εξαγόμενο κείμενο — συνήθως είναι σαρωμένη εικόνα, όχι digital PDF.`,
        file.name,
      );
    }
    extracted.push({ name: file.name, text });
  }

  return parseMultipleMenuPdfTexts(extracted);
}
