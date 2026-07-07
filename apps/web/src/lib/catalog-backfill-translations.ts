import { prisma } from "@menuos/db";
import {
  MENU_AUTO_TRANSLATE_LANGS,
  menuNameFieldsFromTranslations,
  missingAutoTranslateLanguagesFromRows,
  type MenuNameFields,
} from "@menuos/shared";
import { autoFillMenuNamesFromGreek } from "@/lib/menu-translation-service";
import { upsertEntityNameTranslation } from "@/lib/menu-name-upsert";

const EXPECTED_TRANSLATION_LANG_COUNT = 1 + MENU_AUTO_TRANSLATE_LANGS.length;
async function upsertCategoryTranslation(categoryId: string, language: string, name: string | undefined) {
  if (name === undefined) return;
  const trimmed = name.trim();
  if (!trimmed) {
    await prisma.categoryTranslation.deleteMany({ where: { categoryId, language: language as never } });
    return;
  }
  await prisma.categoryTranslation.upsert({
    where: { categoryId_language: { categoryId, language: language as never } },
    create: { categoryId, language: language as never, name: trimmed },
    update: { name: trimmed },
  });
}

async function upsertItemTranslation(itemId: string, language: string, name: string | undefined) {
  if (name === undefined) return;
  const trimmed = name.trim();
  if (!trimmed) {
    await prisma.itemTranslation.deleteMany({ where: { itemId, language: language as never } });
    return;
  }
  await prisma.itemTranslation.upsert({
    where: { itemId_language: { itemId, language: language as never } },
    create: { itemId, language: language as never, name: trimmed },
    update: { name: trimmed },
  });
}

function translationCacheKey(fields: MenuNameFields): string {
  return JSON.stringify(fields);
}

/** True αν κάποιο πιάτο/κατηγορία με ελληνικό όνομα δεν έχει όλες τις auto-translate γλώσσες. */
export async function organizationNeedsTranslationBackfill(organizationId: string): Promise<boolean> {
  const [itemHit, categoryHit] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT i.id
      FROM "Item" i
      INNER JOIN "Category" c ON c.id = i."categoryId"
      INNER JOIN "Menu" m ON m.id = c."menuId"
      INNER JOIN "Venue" v ON v.id = m."venueId"
      WHERE v."organizationId" = ${organizationId}
        AND EXISTS (
          SELECT 1 FROM "ItemTranslation" gr
          WHERE gr."itemId" = i.id AND gr.language = 'GR' AND btrim(gr.name) <> ''
        )
        AND (
          SELECT COUNT(*) FROM "ItemTranslation" it
          WHERE it."itemId" = i.id AND btrim(it.name) <> ''
        ) < ${EXPECTED_TRANSLATION_LANG_COUNT}
      LIMIT 1
    `,
    prisma.$queryRaw<Array<{ id: string }>>`
      SELECT c.id
      FROM "Category" c
      INNER JOIN "Menu" m ON m.id = c."menuId"
      INNER JOIN "Venue" v ON v.id = m."venueId"
      WHERE v."organizationId" = ${organizationId}
        AND EXISTS (
          SELECT 1 FROM "CategoryTranslation" gr
          WHERE gr."categoryId" = c.id AND gr.language = 'GR' AND btrim(gr.name) <> ''
        )
        AND (
          SELECT COUNT(*) FROM "CategoryTranslation" ct
          WHERE ct."categoryId" = c.id AND btrim(ct.name) <> ''
        ) < ${EXPECTED_TRANSLATION_LANG_COUNT}
      LIMIT 1
    `,
  ]);

  return itemHit.length > 0 || categoryHit.length > 0;
}
export async function backfillOrganizationMenuTranslations(organizationId: string) {
  const categories = await prisma.category.findMany({
    where: { menu: { venue: { organizationId } } },
    include: { translations: true },
  });

  const items = await prisma.item.findMany({
    where: { category: { menu: { venue: { organizationId } } } },
    include: { translations: true },
  });

  const fillCache = new Map<string, MenuNameFields>();
  async function fillNames(fields: MenuNameFields): Promise<MenuNameFields> {
    const key = translationCacheKey(fields);
    const cached = fillCache.get(key);
    if (cached) return cached;
    const filled = await autoFillMenuNamesFromGreek(fields.nameGr, fields);
    fillCache.set(key, filled);
    return filled;
  }

  let categoriesUpdated = 0;
  let itemsUpdated = 0;
  let translationApiCalls = 0;

  for (const category of categories) {
    const fields = menuNameFieldsFromTranslations(category.translations);
    if (!fields) continue;
    if (missingAutoTranslateLanguagesFromRows(category.translations).length === 0) continue;

    translationApiCalls += 1;
    const filled = await fillNames(fields);
    await upsertEntityNameTranslation(
      (language, name) => upsertCategoryTranslation(category.id, language, name),
      filled,
    );
    categoriesUpdated += 1;
  }

  for (const item of items) {
    const fields = menuNameFieldsFromTranslations(item.translations);
    if (!fields) continue;
    if (missingAutoTranslateLanguagesFromRows(item.translations).length === 0) continue;

    translationApiCalls += 1;
    const filled = await fillNames(fields);
    await upsertEntityNameTranslation(
      (language, name) => upsertItemTranslation(item.id, language, name),
      filled,
    );
    itemsUpdated += 1;
  }

  return { categoriesUpdated, itemsUpdated, translationApiCalls };
}
