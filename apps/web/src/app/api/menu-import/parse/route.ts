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
import { getMenuForOrganization } from "@/lib/venue-access";

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
    const result = await parseUploadedPdfFiles(files, pageSelections, lang);
    return NextResponse.json({
      ...result,
      menu: { id: menu.id, name: menu.name, venueName: menu.venue.name },
      message:
        result.stats.itemsFound > 0
          ? I.parseFound(catalogEntry.count(result.stats.itemsFound), result.stats.categoriesFound)
          : I.parseEmpty(catalogEntry.many),
    });
  } catch (err) {
    console.error("menu-import parse", err);
    if (err instanceof PdfTextExtractionError || err instanceof OcrSpaceError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: I.parseFailed }, { status: 422 });
  }
}
