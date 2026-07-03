import { GeminiQuotaExceededError } from "@/lib/gemini-usage-service";
import { draftHasLatinOnlyNames, importDraftNeedsGreekTranslation } from "@/lib/menu-import-review";
import {
  PdfTranslateError,
  translateImportDraftToGreek,
} from "@/lib/pdf-import-gemini-translate";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";
import type { PdfImportPipelineResult } from "@/lib/pdf-import-pipeline";

export async function enhancePdfImportWithTranslation(
  result: PdfImportPipelineResult,
  options?: { forceTranslate?: boolean; organizationId?: string },
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
  if (!options?.organizationId) {
    console.warn("pdf-import translate skipped — missing organizationId");
    return result;
  }

  try {
    const { draft: translated, translatedCount } = await translateImportDraftToGreek(result, {
      force: options?.forceTranslate,
      organizationId: options?.organizationId,
    });
    if (translatedCount === 0) {
      const needsTranslation =
        options?.forceTranslate === true
          ? draftHasLatinOnlyNames(result)
          : importDraftNeedsGreekTranslation(result);
      if (needsTranslation) {
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

    return {
      ...translated,
      ocrPagesUsed: result.ocrPagesUsed,
      digitalPagesUsed: result.digitalPagesUsed,
      document: result.document,
      extraction: result.extraction,
      translationApplied: true,
      translatedCount,
    };
  } catch (err) {
    if (err instanceof GeminiQuotaExceededError) throw err;
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
