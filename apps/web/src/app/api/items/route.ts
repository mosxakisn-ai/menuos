import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { itemCreateSchema, buildMenuNameTranslations } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import {
  assertCanAddItemsInTransaction,
  planLimitErrorResponse,
  serializableTransaction,
} from "@/lib/plan-limits";
import { getCategoryForOrganization } from "@/lib/venue-access";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = itemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Συμπλήρωσε όνομα και τιμή." }, { status: 400 });
  }

  const category = await getCategoryForOrganization(parsed.data.categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      await assertCanAddItemsInTransaction(tx, auth.session!.organizationId, 1);

      const maxSort = await tx.item.aggregate({
        where: { categoryId: parsed.data.categoryId },
        _max: { sortOrder: true },
      });

      const nameTranslations = buildMenuNameTranslations(parsed.data);

      return tx.item.create({
        data: {
          categoryId: parsed.data.categoryId,
          price: parsed.data.price,
          label: parsed.data.label ?? null,
          photoUrl: parsed.data.photoUrl?.trim() || null,
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
    }, serializableTransaction);

    return NextResponse.json({
      item,
      message: `Το πιάτο «${parsed.data.nameGr}» προστέθηκε στον κατάλογο.`,
    });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ error: limit.error, code: limit.code }, { status: limit.status });
    }
    throw err;
  }
}
