import { NextResponse } from "next/server";
import { requirePdfImportPlan } from "@/lib/api-auth";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import {
  OcrSpaceError,
  PdfTextExtractionError,
  parseUploadedPdfFiles,
  parsePageSelectionMap,
  readPdfFilesFromFormData,
  validatePdfUploadFiles,
} from "@/lib/pdf-extract";
import { getMenuForOrganization } from "@/lib/venue-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requirePdfImportPlan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const menuId = String(formData.get("menuId") ?? "");
  if (!menuId) {
    return NextResponse.json({ error: "Επίλεξε menu." }, { status: 400 });
  }

  const menu = await getMenuForOrganization(menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: "Ο κατάλογος δεν βρέθηκε." }, { status: 404 });
  }

  const files = readPdfFilesFromFormData(formData);
  const validationError = validatePdfUploadFiles(files);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const pageSelections = parsePageSelectionMap(formData.get("pageSelections"));
    const result = await parseUploadedPdfFiles(files, pageSelections);
    const entry = DASHBOARD_EL.catalogEntry;
    return NextResponse.json({
      ...result,
      menu: { id: menu.id, name: menu.name, venueName: menu.venue.name },
      message:
        result.stats.itemsFound > 0
          ? `Βρέθηκαν ${entry.count(result.stats.itemsFound)} σε ${result.stats.categoriesFound} κατηγορίες. Έλεγξέ τα πριν την εισαγωγή.`
          : `Δεν βρέθηκαν ${entry.many} — δοκίμασε άλλο PDF ή πρόσθεσε χειροκίνητα.`,
    });
  } catch (err) {
    console.error("menu-import parse", err);
    if (err instanceof PdfTextExtractionError || err instanceof OcrSpaceError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      {
        error: "Αποτυχία ανάγνωσης PDF. Δοκίμασε ξανά ή πρόσθεσε τον κατάλογο χειροκίνητα.",
      },
      { status: 422 },
    );
  }
}
