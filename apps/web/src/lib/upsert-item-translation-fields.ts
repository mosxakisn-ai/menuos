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
  const grExists = await prisma.itemTranslation.findUnique({
    where: { itemId_language: { itemId, language: "GR" } },
    select: { id: true },
  });
  if (!grExists) return;

  const description =
    fields.descriptionGr !== undefined ? fields.descriptionGr.trim() || null : undefined;
  const ingredients =
    fields.ingredientsGr !== undefined ? fields.ingredientsGr.trim() || null : undefined;
  const allergens =
    fields.allergensGr !== undefined ? fields.allergensGr.trim() || null : undefined;

  if (description !== undefined || ingredients !== undefined || allergens !== undefined) {
    await prisma.itemTranslation.update({
      where: { itemId_language: { itemId, language: "GR" } },
      data: {
        ...(description !== undefined ? { description } : {}),
        ...(ingredients !== undefined ? { ingredients } : {}),
        ...(allergens !== undefined ? { allergens } : {}),
      },
    });
  }

  if (fields.descriptionGr === undefined) return;

  let descriptionEn: string | null = null;
  const trimmed = fields.descriptionGr.trim();
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
