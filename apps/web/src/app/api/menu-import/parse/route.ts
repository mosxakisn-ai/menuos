import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/api-auth";
import { parseUploadedPdfFiles, readPdfFilesFromFormData, validatePdfUploadFiles } from "@/lib/pdf-extract";
import { getMenuForOrganization } from "@/lib/venue-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const formData = await request.formData();
  const menuId = String(formData.get("menuId") ?? "");
  if (!menuId) {
    return NextResponse.json({ error: "Επίλεξε menu." }, { status: 400 });
  }

  const menu = await getMenuForOrganization(menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const files = readPdfFilesFromFormData(formData);
  const validationError = validatePdfUploadFiles(files);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = await parseUploadedPdfFiles(files);
    return NextResponse.json({
      ...result,
      menu: { id: menu.id, name: menu.name, venueName: menu.venue.name },
      message:
        result.stats.itemsFound > 0
          ? `Βρέθηκαν ${result.stats.itemsFound} πιάτα σε ${result.stats.categoriesFound} κατηγορίες. Έλεγξέ τα πριν την εισαγωγή.`
          : "Δεν βρέθηκαν πιάτα — δοκίμασε άλλο PDF ή πρόσθεσε χειροκίνητα.",
    });
  } catch (err) {
    console.error("menu-import parse", err);
    return NextResponse.json(
      {
        error:
          "Αποτυχία ανάγνωσης PDF. Βεβαιώσου ότι είναι digital PDF (όχι σαρωμένη φωτογραφία).",
      },
      { status: 422 },
    );
  }
}
