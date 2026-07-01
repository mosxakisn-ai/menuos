import { NextResponse } from "next/server";
import type { SupportedLanguage } from "@menuos/db";
import { prisma } from "@menuos/db";
import { categoryPatchSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import { getCategoryForOrganization } from "@/lib/venue-access";
import { DASHBOARD_EL } from "@/content/dashboard-el";

type Params = { params: Promise<{ categoryId: string }> };

async function upsertCategoryName(
  categoryId: string,
  language: SupportedLanguage,
  name: string | undefined,
) {
  if (name === undefined) return;
  const trimmed = name.trim();
  if (!trimmed) {
    await prisma.categoryTranslation.deleteMany({ where: { categoryId, language } });
    return;
  }
  await prisma.categoryTranslation.upsert({
    where: { categoryId_language: { categoryId, language } },
    create: { categoryId, language, name: trimmed },
    update: { name: trimmed },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { categoryId } = await params;
  const existing = await getCategoryForOrganization(categoryId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Η κατηγορία δεν βρέθηκε." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = categoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρο όνομα κατηγορίας." }, { status: 400 });
  }

  let { nameGr, nameEn, nameDe, nameFr } = parsed.data;

  if (nameGr !== undefined) {
    const filled = await autoFillMenuNames({ nameGr, nameEn, nameDe, nameFr });
    nameGr = filled.nameGr;
    const retranslateAll = nameEn === undefined && nameDe === undefined && nameFr === undefined;
    nameEn = retranslateAll ? (filled.nameEn ?? "") : (filled.nameEn ?? undefined);
    nameDe = retranslateAll ? (filled.nameDe ?? "") : (filled.nameDe ?? undefined);
    nameFr = retranslateAll ? (filled.nameFr ?? "") : (filled.nameFr ?? undefined);
  }

  await upsertCategoryName(categoryId, "GR", nameGr);
  await upsertCategoryName(categoryId, "EN", nameEn);
  await upsertCategoryName(categoryId, "DE", nameDe);
  await upsertCategoryName(categoryId, "FR", nameFr);

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { translations: true, items: { include: { translations: true } } },
  });

  return NextResponse.json({
    category,
    message: nameGr ? `Η κατηγορία μετονομάστηκε σε «${nameGr}».` : "Η κατηγορία ενημερώθηκε.",
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { categoryId } = await params;
  const category = await getCategoryForOrganization(categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: "Η κατηγορία δεν βρέθηκε." }, { status: 404 });
  }

  const itemCount = await prisma.item.count({ where: { categoryId } });
  if (itemCount > 0) {
    return NextResponse.json(
      {
        error: DASHBOARD_EL.catalogEntry.categoryHasEntries,
        code: "category_has_items",
      },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true, message: "Η κατηγορία διαγράφηκε." });
}
