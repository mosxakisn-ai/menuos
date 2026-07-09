import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { itemCreateSchema, buildMenuNameTranslations } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { autoFillMenuNames, translateMenuTextFromGreek } from "@/lib/menu-translation-service";
import {
  assertCanAddItemsInTransaction,
  planLimitErrorResponse,
  serializableTransaction,
} from "@/lib/plan-limits";
import { getCategoryForOrganization } from "@/lib/venue-access";
import { normalizeStoredPhotoUrl } from "@/lib/photo-signing";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = itemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: A.fillNameAndPrice }, { status: 400 });
  }

  const category = await getCategoryForOrganization(parsed.data.categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: A.categoryNotFound }, { status: 404 });
  }

  const names = await autoFillMenuNames(parsed.data);
  let descriptionEn = parsed.data.descriptionEn?.trim();
  if (parsed.data.descriptionGr?.trim() && !descriptionEn) {
    const translated = await translateMenuTextFromGreek(parsed.data.descriptionGr, ["EN"], 1000);
    descriptionEn = translated.EN;
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      await assertCanAddItemsInTransaction(tx, auth.session!.organizationId, 1);

      const maxSort = await tx.item.aggregate({
        where: { categoryId: parsed.data.categoryId },
        _max: { sortOrder: true },
      });

      const nameTranslations = buildMenuNameTranslations(names);

      return tx.item.create({
        data: {
          categoryId: parsed.data.categoryId,
          price: parsed.data.price,
          label: parsed.data.label ?? null,
          photoUrl: normalizeStoredPhotoUrl(parsed.data.photoUrl),
          dietaryTags: parsed.data.dietaryTags?.length ? parsed.data.dietaryTags : [],
          allergenCodes: parsed.data.allergenCodes?.length ? parsed.data.allergenCodes : [],
          available: parsed.data.available ?? true,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          extras: parsed.data.extras?.length ? parsed.data.extras : undefined,
          translations: {
            create: nameTranslations.map((row) => ({
              language: row.language,
              name: row.name,
              description:
                row.language === "GR"
                  ? parsed.data.descriptionGr?.trim() || null
                  : row.language === "EN"
                    ? descriptionEn || null
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
      message: copy.catalogEntry.added(parsed.data.nameGr),
    });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ code: limit.code }, { status: limit.status });
    }
    throw err;
  }
}
