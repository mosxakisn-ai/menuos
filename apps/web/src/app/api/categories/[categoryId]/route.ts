import { NextResponse } from "next/server";
import type { SupportedLanguage } from "@menuos/db";
import { prisma } from "@menuos/db";
import { categoryPatchSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import { getCategoryForOrganization } from "@/lib/venue-access";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import {
  patchProvidedAnyTranslatedName,
  upsertEntityNameTranslation,
} from "@/lib/menu-name-upsert";

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

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;
  const { categoryId } = await params;
  const existing = await getCategoryForOrganization(categoryId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: A.categoryNotFound }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = categoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: A.invalidCategoryName }, { status: 400 });
  }

  const { nameGr, ...namePatch } = parsed.data;

  if (nameGr !== undefined) {
    const filled = await autoFillMenuNames({ nameGr, ...namePatch });
    await upsertEntityNameTranslation(
      (language, name) => upsertCategoryName(categoryId, language, name),
      filled,
    );
  } else if (patchProvidedAnyTranslatedName(parsed.data as Record<string, unknown>)) {
    await upsertEntityNameTranslation(
      (language, name) => upsertCategoryName(categoryId, language, name),
      { nameGr: "", ...namePatch },
    );
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { translations: true, items: { include: { translations: true } } },
  });

  const grName = category?.translations.find((t) => t.language === "GR")?.name;

  return NextResponse.json({
    category,
    message: grName ? A.categoryRenamed(grName) : A.categoryUpdated,
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;
  const { categoryId } = await params;
  const category = await getCategoryForOrganization(categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: A.categoryNotFound }, { status: 404 });
  }

  const itemCount = await prisma.item.count({ where: { categoryId } });
  if (itemCount > 0) {
    return NextResponse.json(
      {
        error: copy.catalogEntry.categoryHasEntries,
        code: "category_has_items",
      },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true, message: A.categoryDeleted });
}
