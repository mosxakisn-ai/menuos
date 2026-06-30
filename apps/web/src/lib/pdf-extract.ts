import type { MenuPdfParseResult } from "@menuos/shared";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse = ("default" in mod ? mod.default : mod) as (data: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text ?? "";
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
    const text = await extractTextFromPdfBuffer(buffer);
    extracted.push({ name: file.name, text });
  }

  return parseMultipleMenuPdfTexts(extracted);
}
