import {
  MENU_AUTO_TRANSLATE_LANGS,
  MENU_NAME_FIELD_BY_LANG,
  readMenuNameField,
  type MenuAutoTranslateLang,
  type MenuNameFields,
} from "./menu-translation-langs";

export type { MenuNameFields, MenuAutoTranslateLang };
export { MENU_AUTO_TRANSLATE_LANGS };

/** @deprecated use MenuAutoTranslateLang */
export type MenuNameLang = MenuAutoTranslateLang;

/** Γλώσσες που λείπουν και πρέπει να συμπληρωθούν αυτόματα. */
export function missingMenuNameLanguages(input: MenuNameFields): MenuAutoTranslateLang[] {
  const gr = input.nameGr.trim();
  if (!gr) return [];

  return MENU_AUTO_TRANSLATE_LANGS.filter((lang) => !readMenuNameField(input, lang));
}

export function mergeAutoTranslatedNames(
  input: MenuNameFields,
  translated: Partial<Record<MenuAutoTranslateLang, string>>,
): Required<Pick<MenuNameFields, "nameGr">> & Omit<MenuNameFields, "nameGr"> {
  const out: Required<Pick<MenuNameFields, "nameGr">> & Omit<MenuNameFields, "nameGr"> = {
    nameGr: input.nameGr.trim(),
  };

  for (const lang of MENU_AUTO_TRANSLATE_LANGS) {
    const field = MENU_NAME_FIELD_BY_LANG[lang];
    const manual = readMenuNameField(input, lang);
    const auto = translated[lang]?.trim();
    if (manual || auto) {
      (out as Record<string, string | undefined>)[field] = manual ?? auto;
    }
  }

  return out;
}
