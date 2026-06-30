import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { itemCreateSchema, buildMenuNameTranslations } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { canOrganizationAddItem } from "@/lib/billing";
import { getCategoryForOrganization } from "@/lib/venue-access";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = itemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Συμπλήρωσε όνομα και τιμή." }, { status: 400 });
  }

  const category = await getCategoryForOrganization(parsed.data.categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const itemCheck = await canOrganizationAddItem(auth.session!.organizationId);
  if (!itemCheck.ok) {
    return NextResponse.json({ error: itemCheck.error, code: itemCheck.code }, { status: 403 });
  }

  const maxSort = await prisma.item.aggregate({
    where: { categoryId: parsed.data.categoryId },
    _max: { sortOrder: true },
  });

  const nameTranslations = buildMenuNameTranslations(parsed.data);

  const item = await prisma.item.create({
    data: {
      categoryId: parsed.data.categoryId,
      price: parsed.data.price,
      available: parsed.data.available ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      translations: {
        create: nameTranslations.map((row) => ({
          language: row.language,
          name: row.name,
          description:
            row.language === "GR"
              ? parsed.data.descriptionGr?.trim() || null
              : row.language === "EN"
                ? parsed.data.descriptionEn?.trim() || null
                : null,
          ingredients: row.language === "GR" ? parsed.data.ingredientsGr?.trim() || null : null,
          allergens: row.language === "GR" ? parsed.data.allergensGr?.trim() || null : null,
        })),
      },
    },
    include: { translations: true },
  });

  return NextResponse.json({
    item,
    message: `Το πιάτο «${parsed.data.nameGr}» προστέθηκε στο menu.`,
  });
}
