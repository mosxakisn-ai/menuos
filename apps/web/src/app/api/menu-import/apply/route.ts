import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { menuImportApplySchema, buildMenuNameTranslations } from "@menuos/shared";
import { requirePdfImportPlan } from "@/lib/api-auth";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import {
  assertCanAddItemsInTransaction,
  planLimitErrorResponse,
  serializableTransaction,
} from "@/lib/plan-limits";
import { getMenuForOrganization } from "@/lib/venue-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requirePdfImportPlan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;
  const I = copy.api.import;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = menuImportApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: I.invalidDraft }, { status: 400 });
  }

  const menu = await getMenuForOrganization(parsed.data.menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: A.menuNotFound }, { status: 404 });
  }

  const selectedCategories = parsed.data.categories.filter((c) => c.selected !== false);
  const selectedItems = selectedCategories.flatMap((c) =>
    c.items.filter((i) => i.selected !== false),
  );

  if (selectedItems.length === 0) {
    return NextResponse.json(
      { error: I.selectAtLeastOne(copy.catalogEntry.one) },
      { status: 400 },
    );
  }

  const currentCount = await prisma.item.count({
    where: { category: { menu: { venue: { organizationId: auth.session!.organizationId } } } },
  });

  const maxSortCat = await prisma.category.aggregate({
    where: { menuId: parsed.data.menuId },
    _max: { sortOrder: true },
  });
  let nextCatSort = (maxSortCat._max.sortOrder ?? -1) + 1;

  type PreparedItem = {
    item: (typeof selectedCategories)[number]["items"][number];
    names: Awaited<ReturnType<typeof autoFillMenuNames>>;
  };
  type PreparedCategory = {
    cat: (typeof selectedCategories)[number];
    categoryNames: Awaited<ReturnType<typeof autoFillMenuNames>>;
    items: PreparedItem[];
  };

  const prepared: PreparedCategory[] = [];
  for (const cat of selectedCategories) {
    const items = cat.items.filter((i) => i.selected !== false);
    if (items.length === 0) continue;

    const categoryNames = await autoFillMenuNames({
      nameGr: cat.nameGr.trim(),
      nameEn: cat.nameEn,
      nameDe: cat.nameDe,
      nameFr: cat.nameFr,
    });

    const preparedItems: PreparedItem[] = [];
    for (const item of items) {
      const names = await autoFillMenuNames({
        nameGr: item.nameGr.trim(),
        nameEn: item.nameEn,
        nameDe: item.nameDe,
        nameFr: item.nameFr,
      });
      preparedItems.push({ item, names });
    }
    prepared.push({ cat, categoryNames, items: preparedItems });
  }

  let createdCategories = 0;
  let createdItems = 0;

  try {
    await prisma.$transaction(async (tx) => {
      await assertCanAddItemsInTransaction(
        tx,
        auth.session!.organizationId,
        selectedItems.length,
      );

      for (const { categoryNames, items } of prepared) {
        const category = await tx.category.create({
          data: {
            menuId: parsed.data.menuId,
            sortOrder: nextCatSort++,
            translations: {
              create: buildMenuNameTranslations(categoryNames),
            },
          },
        });
        createdCategories += 1;

        let itemSort = 0;
        for (const { item, names } of items) {
          const nameRows = buildMenuNameTranslations(names);
          await tx.item.create({
            data: {
              categoryId: category.id,
              price: item.price ?? 0,
              available: true,
              sortOrder: itemSort++,
              translations: {
                create: nameRows.map((row) => ({
                  language: row.language,
                  name: row.name,
                  description: row.language === "GR" ? item.descriptionGr?.trim() || null : null,
                })),
              },
            },
          });
          createdItems += 1;
        }
      }
    }, serializableTransaction);
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ code: limit.code }, { status: limit.status });
    }
    throw err;
  }

  return NextResponse.json({
    createdCategories,
    createdItems,
    previousItemCount: currentCount,
    message: I.applySuccess(copy.catalogEntry.count(createdItems), createdCategories),
  });
}
