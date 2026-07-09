import type { SupportedLanguage } from "@menuos/db";
import { prisma } from "@menuos/db";
import { translateMenuTextFromGreek } from "@/lib/menu-translation-service";

export async function upsertItemTranslationTextFields(
  itemId: string,
  fields: {
    descriptionGr?: string;
    ingredientsGr?: string;
    allergensGr?: string;
  },
): Promise<void> {
  const grRow = await prisma.itemTranslation.findUnique({
    where: { itemId_language: { itemId, language: "GR" } },
    select: { id: true, description: true, ingredients: true, allergens: true },
  });
  if (!grRow) return;

  const description =
    fields.descriptionGr !== undefined ? fields.descriptionGr.trim() || null : undefined;
  const ingredients =
    fields.ingredientsGr !== undefined ? fields.ingredientsGr.trim() || null : undefined;
  const allergens =
    fields.allergensGr !== undefined ? fields.allergensGr.trim() || null : undefined;

  const descriptionChanged =
    description !== undefined && description !== (grRow.description?.trim() || null);
  const ingredientsChanged =
    ingredients !== undefined && ingredients !== (grRow.ingredients?.trim() || null);
  const allergensChanged =
    allergens !== undefined && allergens !== (grRow.allergens?.trim() || null);

  if (descriptionChanged || ingredientsChanged || allergensChanged) {
    await prisma.itemTranslation.update({
      where: { itemId_language: { itemId, language: "GR" } },
      data: {
        ...(descriptionChanged ? { description } : {}),
        ...(ingredientsChanged ? { ingredients } : {}),
        ...(allergensChanged ? { allergens } : {}),
      },
    });
  }

  if (!descriptionChanged) return;

  let descriptionEn: string | null = null;
  const trimmed = fields.descriptionGr?.trim() ?? "";
  if (trimmed) {
    const translated = await translateMenuTextFromGreek(trimmed, ["EN"], 1000);
    descriptionEn = translated.EN ?? null;
  }

  const enRow = await prisma.itemTranslation.findUnique({
    where: { itemId_language: { itemId, language: "EN" as SupportedLanguage } },
    select: { id: true },
  });
  if (!enRow) return;

  await prisma.itemTranslation.update({
    where: { itemId_language: { itemId, language: "EN" } },
    data: { description: descriptionEn },
  });
}
