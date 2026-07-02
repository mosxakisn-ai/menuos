import {
  assessMenuParseQuality,
  menuImportDocumentToParseResult,
  menuPdfParseResultToDocument,
  mergeMenuImportSections,
  type MenuImportSection,
} from "@menuos/shared";
import { renderPdfPageToJpeg } from "@/lib/pdf-page-render";
import {
  parseMenuPageImageWithGemini,
  PdfVisionError,
  shouldRunPdfVision,
} from "@/lib/pdf-vision-gemini";
import type { PdfImportPipelineResult } from "@/lib/pdf-import-pipeline";

export type PdfImportFileContext = {
  name: string;
  buffer: Buffer;
  ocrPageNumbers: number[];
};

export async function enhancePdfImportWithVision(
  result: PdfImportPipelineResult,
  fileContexts: PdfImportFileContext[],
  options?: { forceVision?: boolean },
): Promise<PdfImportPipelineResult> {
  if (
    !shouldRunPdfVision({
      ocrPages: result.extraction.ocrPages,
      suggestsVision: result.extraction.suggestsVision,
      forceVision: options?.forceVision,
    })
  ) {
    return result;
  }

  const allSections: MenuImportSection[] = [];
  let visionPages = 0;

  for (const file of fileContexts) {
    for (const pageNum of file.ocrPageNumbers) {
      try {
        const jpeg = await renderPdfPageToJpeg(file.buffer, pageNum);
        const sections = await parseMenuPageImageWithGemini(jpeg);
        allSections.push(...sections);
        visionPages += 1;
      } catch (err) {
        console.warn("pdf-import vision page skipped", file.name, pageNum, err);
      }
    }
  }

  if (allSections.length === 0 || visionPages === 0) {
    return result;
  }

  const mergedSections = mergeMenuImportSections(allSections, fileContexts[0]?.name);
  const doc = {
    languages: ["el", "en"] as const,
    sections: mergedSections,
    source: {
      path: "vision" as const,
      digitalPages: result.extraction.digitalPages,
      ocrPages: result.extraction.ocrPages,
      visionPages,
    },
  };

  const visionParsed = menuImportDocumentToParseResult({
    languages: [...doc.languages],
    sections: doc.sections,
    source: doc.source,
  });

  if (visionParsed.stats.itemsFound < Math.max(5, result.stats.itemsFound * 0.5)) {
    console.warn(
      "pdf-import vision rejected — too few items",
      visionParsed.stats.itemsFound,
      "vs rules",
      result.stats.itemsFound,
    );
    return result;
  }

  const quality = assessMenuParseQuality(visionParsed);
  const document = menuPdfParseResultToDocument(visionParsed, {
    path: "vision",
    digitalPages: result.extraction.digitalPages,
    ocrPages: result.extraction.ocrPages,
    confidence: quality.confidence,
    suggestsVision: false,
  });

  return {
    ...visionParsed,
    warnings: [
      ...visionParsed.warnings,
      `Ανάλυση εικόνας (Vision AI) — ${visionPages} σελίδες.`,
    ],
    stats: {
      ...visionParsed.stats,
      filesProcessed: result.stats.filesProcessed,
    },
    ocrPagesUsed: result.ocrPagesUsed,
    digitalPagesUsed: result.digitalPagesUsed,
    document,
    extraction: {
      path:
        result.extraction.digitalPages > 0
          ? "hybrid"
          : "vision",
      digitalPages: result.extraction.digitalPages,
      ocrPages: result.extraction.ocrPages,
      confidence: quality.confidence,
      suggestsVision: false,
      visionPages,
      visionUsed: true,
    },
  };
}

export { PdfVisionError };
