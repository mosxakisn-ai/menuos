import type { SupportedLanguage } from "@menuos/db";
import {
  buildMenuNameTranslations,
  menuNameFieldsFromTranslations,
  missingAutoTranslateLanguagesFromRows,
  type QrMenuLanguage,
} from "@menuos/shared";
import { autoFillMenuNamesFromGreek } from "@/lib/menu-translation-service";

type NameRow = { language: SupportedLanguage; name: string };

const TRANSLATION_CACHE_TTL_MS = 24 * 3600_000;

type CachedNameRows = { rows: NameRow[]; expires: number };

/** Process-level cache — αποφεύγει DeepL/MyMemory σε κάθε QR page load. */
const nameTranslationCache = new Map<string, CachedNameRows>();

function readCachedNameRows(key: string): NameRow[] | null {
  const hit = nameTranslationCache.get(key);
  if (!hit || hit.expires <= Date.now()) {
    if (hit) nameTranslationCache.delete(key);
    return null;
  }
  return hit.rows;
}

function writeCachedNameRows(key: string, rows: NameRow[]) {
  nameTranslationCache.set(key, { rows, expires: Date.now() + TRANSLATION_CACHE_TTL_MS });
}

async function filledMenuNameRows(menuId: string, menuName: string): Promise<NameRow[]> {
  const fallbackGr = menuName.trim();
  if (!fallbackGr) return [];

  const fields = { nameGr: fallbackGr };
  const persistKey = `menu:${menuId}:${fallbackGr}`;
  const cached = readCachedNameRows(persistKey);
  if (cached) return cached;

  const filled = await autoFillMenuNamesFromGreek(fields.nameGr, fields);
  const rows = buildMenuNameTranslations(filled).map((row) => ({
    language: row.language as SupportedLanguage,
    name: row.name,
  }));
  writeCachedNameRows(persistKey, rows);
  return rows;
}

type VenueMenu = {
  id: string;
  name: string;
  categories: Array<{
    id: string;
    translations: { language: string; name: string }[];
    items: Array<{
      id: string;
      price: { toString(): string };
      photoUrl: string | null;
      label: string | null;
      extras: unknown;
      translations: Array<{
        language: string;
        name: string;
        description?: string | null;
        ingredients?: string | null;
        allergens?: string | null;
      }>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

/** Συμπληρώνει μεταφράσεις ονομάτων καταλόγου (Menu.name) για tabs QR menu. */
export async function enrichPublicMenuTranslations(menus: VenueMenu[]) {
  return Promise.all(
    menus.map(async (menu) => ({
      ...menu,
      translations: await filledMenuNameRows(menu.id, menu.name),
    })),
  );
}

export type PublicMenuTranslationLang = QrMenuLanguage;
