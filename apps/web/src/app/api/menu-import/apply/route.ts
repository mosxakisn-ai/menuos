import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { menuImportApplySchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { canOrganizationAddItems } from "@/lib/billing";
import { getMenuForOrganization } from "@/lib/venue-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = menuImportApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Έλεγξε κατηγορίες, ονόματα και τιμές πριν την εισαγωγή." },
      { status: 400 },
    );
  }

  const menu = await getMenuForOrganization(parsed.data.menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const selectedCategories = parsed.data.categories.filter((c) => c.selected !== false);
  const selectedItems = selectedCategories.flatMap((c) =>
    c.items.filter((i) => i.selected !== false),
  );

  if (selectedItems.length === 0) {
    return NextResponse.json({ error: "Επίλεξε τουλάχιστον ένα πιάτο με τιμή." }, { status: 400 });
  }

  const itemCheck = await canOrganizationAddItems(
    auth.session!.organizationId,
    selectedItems.length,
  );
  if (!itemCheck.ok) {
    return NextResponse.json({ error: itemCheck.error, code: itemCheck.code }, { status: 403 });
  }

  const currentCount = await prisma.item.count({
    where: { category: { menu: { venue: { organizationId: auth.session!.organizationId } } } },
  });

  const maxSortCat = await prisma.category.aggregate({
    where: { menuId: parsed.data.menuId },
    _max: { sortOrder: true },
  });
  let nextCatSort = (maxSortCat._max.sortOrder ?? -1) + 1;

  let createdCategories = 0;
  let createdItems = 0;

  await prisma.$transaction(async (tx) => {
    for (const cat of selectedCategories) {
      const items = cat.items.filter((i) => i.selected !== false);
      if (items.length === 0) continue;

      const category = await tx.category.create({
        data: {
          menuId: parsed.data.menuId,
          sortOrder: nextCatSort++,
          translations: {
            create: [
              { language: "GR", name: cat.nameGr.trim() },
              ...(cat.nameEn?.trim()
                ? [{ language: "EN" as const, name: cat.nameEn.trim() }]
                : []),
            ],
          },
        },
      });
      createdCategories += 1;

      let itemSort = 0;
      for (const item of items) {
        const grName = item.nameGr.trim();
        const enName = item.nameEn?.trim();
        await tx.item.create({
          data: {
            categoryId: category.id,
            price: item.price,
            available: true,
            sortOrder: itemSort++,
            translations: {
              create: [
                {
                  language: "GR",
                  name: grName,
                  description: item.descriptionGr?.trim() || null,
                },
                ...(enName
                  ? [
                      {
                        language: "EN" as const,
                        name: enName,
                        description: null as string | null,
                      },
                    ]
                  : []),
              ],
            },
          },
        });
        createdItems += 1;
      }
    }
  });

  return NextResponse.json({
    createdCategories,
    createdItems,
    previousItemCount: currentCount,
    message: `Εισήχθησαν ${createdItems} πιάτα σε ${createdCategories} κατηγορίες. Μπορείς να τα επεξεργαστείς (φωτο, τιμές) από το Menu.`,
  });
}
