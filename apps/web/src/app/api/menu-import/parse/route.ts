import { NextResponse } from "next/server";
import { requirePdfImportPlan } from "@/lib/api-auth";
import {
  OcrSpaceError,
  PdfTextExtractionError,
  parseUploadedPdfFiles,
  parsePageSelectionMap,
  readPdfFilesFromFormData,
  validatePdfUploadFiles,
} from "@/lib/pdf-extract";
import { dashboardCopyFromRequest, dashboardLangFromRequest } from "@/lib/dashboard-request-locale";
import { logServerDiagnostic } from "@/lib/client-diagnostics-service";
import { GeminiQuotaExceededError } from "@/lib/gemini-usage-service";
import { getMenuForOrganization } from "@/lib/venue-access";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePdfImportPlan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const lang = dashboardLangFromRequest(request);
  const copy = dashboardCopyFromRequest(request);
  const { catalogEntry } = copy;
  const I = copy.api.import;
  const formData = await request.formData();
  const menuId = String(formData.get("menuId") ?? "");
  if (!menuId) {
    return NextResponse.json({ error: I.selectMenu }, { status: 400 });
  }

  const menu = await getMenuForOrganization(menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: copy.api.menuNotFound }, { status: 404 });
  }

  const files = readPdfFilesFromFormData(formData);
  const validationError = validatePdfUploadFiles(files, lang);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const pageSelections = parsePageSelectionMap(formData.get("pageSelections"));
    const forceVision = String(formData.get("forceVision") ?? "") === "1";
    const forceTranslate = String(formData.get("forceTranslate") ?? "") === "1";
    const result = await parseUploadedPdfFiles(files, pageSelections, lang, {
      forceVision,
      forceTranslate,
      organizationId: auth.session!.organizationId,
    });
    return NextResponse.json({
      ...result,
      visionAvailable: isPdfVisionConfigured(),
      geminiAvailable: isPdfVisionConfigured(),
      menu: { id: menu.id, name: menu.name, venueName: menu.venue.name },
      message:
        result.stats.itemsFound > 0
          ? I.parseFound(catalogEntry.count(result.stats.itemsFound), result.stats.categoriesFound)
          : I.parseEmpty(catalogEntry.many),
    });
  } catch (err) {
    console.error("menu-import parse", err);
    if (err instanceof GeminiQuotaExceededError) {
      return NextResponse.json(
        {
          error: I.geminiQuotaExceeded(err.usage, err.limit),
          code: "gemini_quota",
        },
        { status: 429 },
      );
    }
    if (err instanceof PdfTextExtractionError || err instanceof OcrSpaceError) {
      logServerDiagnostic({
        organizationId: auth.session!.organizationId,
        userId: auth.session!.userId,
        userEmail: auth.session!.email,
        source: "server",
        category: "pdf_import",
        message: err.message,
        errorCode: err instanceof OcrSpaceError ? "ocr_failed" : "pdf_extract_failed",
        context: { menuId, fileName: err instanceof PdfTextExtractionError ? err.fileName : undefined },
      });
      return NextResponse.json(
        { error: err.message, diagnosticLogged: true, code: err instanceof OcrSpaceError ? "ocr_failed" : "pdf_extract_failed" },
        { status: 422 },
      );
    }
    logServerDiagnostic({
      organizationId: auth.session!.organizationId,
      userId: auth.session!.userId,
      userEmail: auth.session!.email,
      source: "server",
      category: "pdf_import",
      message: err instanceof Error ? err.message : I.parseFailed,
      errorCode: "parse_failed",
    });
    return NextResponse.json({ error: I.parseFailed, diagnosticLogged: true, code: "parse_failed" }, { status: 422 });
  }
}
