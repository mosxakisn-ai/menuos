import { NextResponse } from "next/server";
import { requirePdfImportPlan } from "@/lib/api-auth";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import { logServerDiagnostic } from "@/lib/client-diagnostics-service";
import {
  importDraftNeedsGreekTranslation,
  normalizeImportDraft,
} from "@/lib/menu-import-review";
import { PdfTranslateError, translateImportDraftToGreek } from "@/lib/pdf-import-gemini-translate";
import { isPdfVisionConfigured } from "@/lib/pdf-vision-gemini";
import type { MenuPdfParseResult } from "@menuos/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePdfImportPlan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const I = copy.api.import;

  if (!isPdfVisionConfigured()) {
    return NextResponse.json({ error: I.translateUnavailable }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: I.translateInvalidDraft }, { status: 400 });
  }

  const draft = (body as { draft?: MenuPdfParseResult }).draft;
  if (!draft?.categories || !Array.isArray(draft.categories)) {
    return NextResponse.json({ error: I.translateInvalidDraft }, { status: 400 });
  }

  if (!importDraftNeedsGreekTranslation(draft)) {
    return NextResponse.json({
      draft: normalizeImportDraft(draft),
      translatedCount: 0,
      message: I.translateNothingNeeded,
    });
  }

  try {
    const { draft: translated, translatedCount } = await translateImportDraftToGreek(draft);
    return NextResponse.json({
      draft: normalizeImportDraft(translated),
      translatedCount,
      message: I.translateSuccess(translatedCount),
    });
  } catch (err) {
    console.error("menu-import translate", err);
    logServerDiagnostic({
      organizationId: auth.session!.organizationId,
      userId: auth.session!.userId,
      userEmail: auth.session!.email,
      source: "server",
      category: "pdf_import",
      message: err instanceof Error ? err.message : I.translateFailed,
      errorCode: "translate_failed",
    });
    return NextResponse.json(
      {
        error: err instanceof PdfTranslateError ? err.message : I.translateFailed,
        diagnosticLogged: true,
        code: "translate_failed",
      },
      { status: 422 },
    );
  }
}
