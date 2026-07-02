import { isLatinOnlyMenuText, type MenuPdfParseResult } from "@menuos/shared";
import { geminiGenerateContent } from "@/lib/gemini-fetch";
import { draftHasLatinOnlyNames, importDraftNeedsGreekTranslation } from "@/lib/menu-import-review";

const TRANSLATE_PROMPT = `You translate restaurant/hotel menu names from English to Greek for a Greek QR menu app.

Return ONLY valid JSON (no markdown):
{
  "entries": [
    { "id": "cat-1", "nameGr": "Σαλάτες" },
    { "id": "cat-1-item-2", "nameGr": "Κλασική χωριάτικη" }
  ]
}

Rules:
- nameGr must be natural Greek menu wording (not Latin transliteration).
- Keep well-known brand/cheese/place names when Greeks use them (e.g. Katiki Domakou, Archangelos).
- Translate category headers naturally (SALADS → Σαλάτες, PASTA → Ζυμαρικά).
- Do not invent items — translate only the provided English names.
- Return exactly one entry per input id, same ids as given.
- Short, menu-style Greek — no long descriptions.`;

export class PdfTranslateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfTranslateError";
  }
}

type TranslateEntry = { id: string; nameEn: string };

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function collectTranslateEntries(draft: MenuPdfParseResult): TranslateEntry[] {
  const entries: TranslateEntry[] = [];

  for (const cat of draft.categories) {
    const english = cat.nameEn?.trim() || cat.nameGr.trim();
    if (english && isLatinOnlyMenuText(cat.nameGr)) {
      entries.push({ id: cat.id, nameEn: english });
    }
    for (const item of cat.items) {
      const itemEnglish = item.nameEn?.trim() || item.nameGr.trim();
      if (itemEnglish && isLatinOnlyMenuText(item.nameGr)) {
        entries.push({ id: item.id, nameEn: itemEnglish });
      }
    }
  }

  return entries;
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
    throw new PdfTranslateError("Translation model did not return valid JSON.");
  }
}

async function translateBatch(entries: TranslateEntry[]): Promise<Map<string, string>> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new PdfTranslateError("GEMINI_API_KEY is not configured.");

  const model = geminiModel();
  const payload = entries.map((e) => ({ id: e.id, nameEn: e.nameEn }));
  const userText = `${TRANSLATE_PROMPT}\n\nTranslate these menu entries:\n${JSON.stringify(payload)}`;

  const res = await geminiGenerateContent(model, apiKey, {
    contents: [{ parts: [{ text: userText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.15,
    },
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  if (!res.ok) {
    throw new PdfTranslateError(data.error?.message ?? `Gemini HTTP ${res.status}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new PdfTranslateError("Empty response from Gemini translation.");

  const parsed = extractJsonFromGeminiText(text) as {
    entries?: Array<{ id?: string; nameGr?: string }>;
  };

  const map = new Map<string, string>();
  for (const row of parsed.entries ?? []) {
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const nameGr = typeof row.nameGr === "string" ? row.nameGr.trim() : "";
    if (id && nameGr.length >= 2) map.set(id, nameGr);
  }

  if (map.size === 0) {
    throw new PdfTranslateError("No Greek translations returned.");
  }

  return map;
}

const BATCH_SIZE = 60;

export async function translateImportDraftToGreek(
  draft: MenuPdfParseResult,
  options?: { force?: boolean },
): Promise<{ draft: MenuPdfParseResult; translatedCount: number; untranslatedCount: number }> {
  const shouldRun =
    options?.force === true
      ? draftHasLatinOnlyNames(draft)
      : importDraftNeedsGreekTranslation(draft);

  if (!shouldRun) {
    return { draft, translatedCount: 0, untranslatedCount: 0 };
  }

  const entries = collectTranslateEntries(draft);
  if (entries.length === 0) {
    return { draft, translatedCount: 0, untranslatedCount: 0 };
  }

  const translations = new Map<string, string>();
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchResult = await translateBatch(batch);
    for (const [id, nameGr] of batchResult) {
      translations.set(id, nameGr);
    }
  }

  let translatedCount = 0;
  const categories = draft.categories.map((cat) => {
    const catGr = translations.get(cat.id);
    const nextCat = catGr ? { ...cat, nameGr: catGr } : cat;
    if (catGr) translatedCount += 1;

    const items = nextCat.items.map((item) => {
      const itemGr = translations.get(item.id);
      if (!itemGr) return item;
      translatedCount += 1;
      return { ...item, nameGr: itemGr };
    });

    return { ...nextCat, items };
  });

  const untranslatedCount = entries.filter((e) => !translations.has(e.id)).length;
  const warnings = draft.warnings.filter((w) => !w.startsWith("Μετάφραση AI"));

  if (translatedCount > 0) {
    warnings.push(`Μετάφραση AI — ${translatedCount} ονόματα στα ελληνικά.`);
  }
  if (untranslatedCount > 0) {
    warnings.push(
      untranslatedCount === 1
        ? "Μερική μετάφραση — 1 όνομα έμεινε στα αγγλικά, έλεγξέ το χειροκίνητα."
        : `Μερική μετάφραση — ${untranslatedCount} ονόματα έμειναν στα αγγλικά, έλεγξέ τα χειροκίνητα.`,
    );
  }

  return {
    draft: {
      ...draft,
      categories,
      warnings,
    },
    translatedCount,
    untranslatedCount,
  };
}
