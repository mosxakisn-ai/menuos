import type { MenuImportSection } from "@menuos/shared";

import { geminiGenerateContentForOrg } from "@/lib/gemini-request";

const MENU_VISION_PROMPT = `You analyze a restaurant/hotel menu page image.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "sections": [
    {
      "title": "Greek or primary category name",
      "titleEn": "optional English category",
      "items": [
        {
          "name": "item name in Greek or primary language",
          "nameEn": "optional English name",
          "description": "optional short description",
          "price": 12.5
        }
      ]
    }
  ]
}

Rules:
- Distinguish SECTION HEADERS from menu items using layout (headers are larger/separate, not priced rows).
- price is a number in EUR without currency symbol; null only if truly missing on the page.
- Skip logos, decorative photos, page numbers, footnotes-only lines, and allergen legends unless part of an item description.
- Bilingual menus: Greek in name, English in nameEn when both appear on the page.
- English-only menus (no Greek script visible): put the visible English text in nameEn and a natural Greek menu translation in name.
- Do not invent items not visible on this page.
- Empty sections array is OK for cover/decorative pages.`;

export class PdfVisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfVisionError";
  }
}

export function isPdfVisionConfigured(): boolean {
  if (process.env.PDF_IMPORT_VISION === "0") return false;
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function shouldRunPdfVision(params: {
  ocrPages: number;
  suggestsVision: boolean;
  forceVision?: boolean;
}): boolean {
  if (!isPdfVisionConfigured()) return false;
  if (params.ocrPages <= 0) return false;
  if (params.forceVision) return true;

  const mode = process.env.PDF_IMPORT_VISION_MODE?.trim().toLowerCase() || "auto";
  if (mode === "never" || mode === "off") return false;
  if (mode === "always" || mode === "ocr") return true;
  // auto: only when rules confidence is low
  return params.suggestsVision;
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function normalizePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw).replace(",", "."));
  if (!Number.isFinite(value) || value < 0 || value > 9999) return null;
  return Math.round(value * 100) / 100;
}

function normalizeItem(raw: unknown): MenuImportSection["items"][number] | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (name.length < 2) return null;
  return {
    name,
    ...(typeof row.nameEn === "string" && row.nameEn.trim() ? { nameEn: row.nameEn.trim() } : {}),
    ...(typeof row.description === "string" && row.description.trim()
      ? { description: row.description.trim() }
      : {}),
    price: normalizePrice(row.price),
  };
}

function normalizeSection(raw: unknown): MenuImportSection | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (title.length < 2) return null;
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items = itemsRaw.map(normalizeItem).filter((i): i is NonNullable<typeof i> => i !== null);
  if (items.length === 0) return null;
  return {
    title,
    ...(typeof row.titleEn === "string" && row.titleEn.trim() ? { titleEn: row.titleEn.trim() } : {}),
    items,
  };
}

export function parseVisionMenuJson(raw: unknown): MenuImportSection[] {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sectionsRaw = Array.isArray(root.sections) ? root.sections : [];
  return sectionsRaw.map(normalizeSection).filter((s): s is MenuImportSection => s !== null);
}

function extractJsonFromGeminiText(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) return JSON.parse(fence[1].trim());
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new PdfVisionError("Vision model did not return valid JSON.");
  }
}

export async function parseMenuPageImageWithGemini(
  jpeg: Buffer,
  organizationId: string,
): Promise<MenuImportSection[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new PdfVisionError("GEMINI_API_KEY is not configured.");

  const model = geminiModel();

  const { response: res, data } = await geminiGenerateContentForOrg(
    organizationId,
    "vision",
    model,
    apiKey,
    {
      contents: [
        {
          parts: [
            { text: MENU_VISION_PROMPT },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: jpeg.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    },
  );

  if (!res.ok) {
    throw new PdfVisionError(data.error?.message ?? `Gemini HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new PdfVisionError("Empty response from Gemini vision.");

  const parsed = parseVisionMenuJson(extractJsonFromGeminiText(text));
  if (parsed.length === 0) {
    throw new PdfVisionError("No menu sections extracted from page image.");
  }

  return parsed;
}
