import {
  assessMenuParseQuality,
  menuPdfParseResultToDocument,
  parseMultipleMenuPdfTexts,
  type MenuImportDocument,
  type MenuImportExtractionPath,
  type MenuPdfParseResult,
} from "@menuos/shared";

export type PdfImportExtractionPath = MenuImportExtractionPath;

export type PdfImportExtractionMeta = {
  path: PdfImportExtractionPath;
  digitalPages: number;
  ocrPages: number;
  confidence: number;
  suggestsVision: boolean;
  visionPages?: number;
  visionUsed?: boolean;
};

export type PdfImportPipelineResult = MenuPdfParseResult & {
  ocrPagesUsed: number;
  digitalPagesUsed: number;
  document: MenuImportDocument;
  extraction: PdfImportExtractionMeta;
};

function resolveExtractionPath(digitalPages: number, ocrPages: number): PdfImportExtractionPath {
  if (ocrPages === 0) return "digital";
  if (digitalPages === 0) return "ocr";
  return "hybrid";
}

/** Rules-based parse → JSON document → quality score. Vision layer may override in pdf-import-vision.ts */
export function finalizePdfImportPipeline(
  files: { name: string; text: string }[],
  pageStats: { digitalPages: number; ocrPages: number },
): PdfImportPipelineResult {
  const parsed = parseMultipleMenuPdfTexts(files);
  const quality = assessMenuParseQuality(parsed);
  const path = resolveExtractionPath(pageStats.digitalPages, pageStats.ocrPages);

  const document = menuPdfParseResultToDocument(parsed, {
    path,
    digitalPages: pageStats.digitalPages,
    ocrPages: pageStats.ocrPages,
    confidence: quality.confidence,
    suggestsVision: quality.suggestsVision,
  });

  return {
    ...parsed,
    ocrPagesUsed: pageStats.ocrPages,
    digitalPagesUsed: pageStats.digitalPages,
    document,
    extraction: {
      path,
      digitalPages: pageStats.digitalPages,
      ocrPages: pageStats.ocrPages,
      confidence: quality.confidence,
      suggestsVision: quality.suggestsVision,
      visionUsed: false,
    },
  };
}
