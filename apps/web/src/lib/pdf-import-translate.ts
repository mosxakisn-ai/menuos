import { importDraftNeedsGreekTranslation } from "@/lib/menu-import-review";
import {
  PdfTranslateError,
  translateImportDraftToGreek,
} from "@/lib/pdf-import-gemini-translate";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";
import type { PdfImportPipelineResult } from "@/lib/pdf-import-pipeline";

export async function enhancePdfImportWithTranslation(
  result: PdfImportPipelineResult,
  options?: { forceTranslate?: boolean },
): Promise<
  PdfImportPipelineResult & {
    translationApplied?: boolean;
    translatedCount?: number;
  }
> {
  if (!isPdfVisionConfigured()) return result;
  if (!options?.forceTranslate && !importDraftNeedsGreekTranslation(result)) {
    return result;
  }

  try {
    const { draft, translatedCount } = await translateImportDraftToGreek(result);
    if (translatedCount === 0) return result;

    return {
      ...draft,
      ocrPagesUsed: result.ocrPagesUsed,
      digitalPagesUsed: result.digitalPagesUsed,
      document: result.document,
      extraction: result.extraction,
      translationApplied: true,
      translatedCount,
    };
  } catch (err) {
    console.warn("pdf-import translate skipped", err);
    if (options?.forceTranslate) throw err;
    if (importDraftNeedsGreekTranslation(result)) {
      return {
        ...result,
        warnings: [
          ...result.warnings,
          "Μετάφραση AI δεν ολοκληρώθηκε — έλεγξε τα αγγλικά ονόματα ή δοκίμασε ξανά.",
        ],
      };
    }
    return result;
  }
}

export { PdfTranslateError };
