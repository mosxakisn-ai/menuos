import type { SupportedLanguage } from "@menuos/db";
import {
  MENU_AUTO_TRANSLATE_LANGS,
  MENU_NAME_FIELD_BY_LANG,
  type MenuAutoTranslateLang,
  type MenuNameFields,
} from "@menuos/shared";

export function patchProvidedAnyTranslatedName(body: Record<string, unknown>): boolean {
  return MENU_AUTO_TRANSLATE_LANGS.some((lang) => body[MENU_NAME_FIELD_BY_LANG[lang]] !== undefined);
}

export async function upsertEntityNameTranslation(
  upsert: (language: SupportedLanguage, name: string | undefined) => Promise<void>,
  names: MenuNameFields,
) {
  await upsert("GR", names.nameGr?.trim() || undefined);
  for (const lang of MENU_AUTO_TRANSLATE_LANGS) {
    const field = MENU_NAME_FIELD_BY_LANG[lang];
    const value = (names[field] as string | undefined)?.trim() || undefined;
    await upsert(lang as SupportedLanguage, value);
  }
}

export function filledNamesAfterPatch(
  filled: MenuNameFields,
  patch: Partial<MenuNameFields>,
  retranslateAll: boolean,
): MenuNameFields {
  const out: MenuNameFields = { nameGr: filled.nameGr };
  for (const lang of MENU_AUTO_TRANSLATE_LANGS) {
    const field = MENU_NAME_FIELD_BY_LANG[lang];
    const patchVal = patch[field];
    if (patchVal !== undefined) {
      (out as Record<string, string | undefined>)[field] = patchVal?.trim() || undefined;
    } else if (retranslateAll) {
      (out as Record<string, string | undefined>)[field] = (filled[field] as string | undefined)?.trim() || undefined;
    }
  }
  return out;
}

export type { MenuAutoTranslateLang };
