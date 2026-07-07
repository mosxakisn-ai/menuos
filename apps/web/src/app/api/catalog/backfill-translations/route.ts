import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/api-auth";
import { backfillOrganizationMenuTranslations } from "@/lib/catalog-backfill-translations";

/** Συμπληρώνει αυτόματα μεταφράσεις (EN, DE, FR, PL, …) για όλες τις κατηγορίες/πίατα του οργανισμού. */
export async function POST() {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const result = await backfillOrganizationMenuTranslations(auth.session!.organizationId);
  return NextResponse.json({
    ok: true,
    ...result,
    message: `Ενημερώθηκαν ${result.categoriesUpdated} κατηγορίες και ${result.itemsUpdated} πιάτα.`,
  });
}
