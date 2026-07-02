const OCR_SPACE_URL = "https://api.ocr.space/parse/image";
const MAX_IMAGE_BYTES = 980_000;

export class OcrSpaceError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "OcrSpaceError";
  }
}

type OcrSpaceResponse = {
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: Array<{ ParsedText?: string }>;
};

export function isOcrSpaceConfigured(): boolean {
  return Boolean(process.env.OCR_SPACE_API_KEY?.trim());
}

function ocrApiUrl(): string {
  return process.env.OCR_SPACE_API_URL?.trim() || OCR_SPACE_URL;
}

function ocrEngine(): string {
  // Engine 3 supports Greek + auto-detect; Engine 2 does not accept `gre`.
  return process.env.OCR_SPACE_ENGINE?.trim() || "3";
}

function ocrIsTable(): boolean {
  const raw = process.env.OCR_SPACE_IS_TABLE?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  if (raw === "0" || raw === "false" || raw === "no") return false;
  // Table mode merges adjacent columns on bilingual menus — default off.
  return false;
}

function ocrLanguage(override?: string): string {
  const custom = override?.trim() || process.env.OCR_SPACE_LANGUAGE?.trim();
  const engine = ocrEngine();

  if (!custom || custom === "auto") {
    return engine === "1" ? "gre" : "auto";
  }

  // Engine 2 has no Greek (`gre`) — autodetect Latin scripts only.
  if (custom === "gre" && engine === "2") {
    return "auto";
  }

  return custom;
}

function formatOcrError(data: OcrSpaceResponse): string {
  const raw = data.ErrorMessage;
  if (Array.isArray(raw)) return raw.join("; ");
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "Αποτυχία OCR.";
}

/** OCR.space — 1 image buffer → plain text (free tier: 1MB, 500 req/day). */
export async function ocrImageBuffer(
  imageBuffer: Buffer,
  fileName: string,
  options?: { language?: string },
): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY?.trim();
  if (!apiKey) {
    throw new OcrSpaceError("Δεν έχει ρυθμιστεί OCR_SPACE_API_KEY.");
  }
  if (imageBuffer.length > MAX_IMAGE_BYTES) {
    throw new OcrSpaceError(
      `Η εικόνα «${fileName}» είναι πολύ μεγάλη για το δωρεάν OCR (max ~1MB).`,
    );
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
    fileName.endsWith(".jpg") ? fileName : `${fileName}.jpg`,
  );
  form.append("language", ocrLanguage(options?.language));
  form.append("isTable", ocrIsTable() ? "true" : "false");
  form.append("scale", "true");
  form.append("detectOrientation", "true");
  form.append("OCREngine", ocrEngine());
  form.append("filetype", "JPG");

  const res = await fetch(ocrApiUrl(), {
    method: "POST",
    headers: { apikey: apiKey },
    body: form,
  });

  if (!res.ok) {
    throw new OcrSpaceError(`OCR API HTTP ${res.status}`, res.status);
  }

  const data = (await res.json()) as OcrSpaceResponse;
  if (data.IsErroredOnProcessing || data.OCRExitCode !== 1) {
    throw new OcrSpaceError(formatOcrError(data));
  }

  return (
    data.ParsedResults?.map((r) => r.ParsedText?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim() ?? ""
  );
}
