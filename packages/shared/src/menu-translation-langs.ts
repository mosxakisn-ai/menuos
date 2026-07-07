/** Auto-translated catalog name fields (excluding Greek source). */
export const MENU_AUTO_TRANSLATE_LANGS = [
  "EN",
  "DE",
  "FR",
  "PL",
  "CS",
  "IT",
  "SV",
  "FI",
  "TR",
] as const;

export type MenuAutoTranslateLang = (typeof MENU_AUTO_TRANSLATE_LANGS)[number];

export type MenuNameFields = {
  nameGr: string;
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
  namePl?: string | null;
  nameCs?: string | null;
  nameIt?: string | null;
  nameSv?: string | null;
  nameFi?: string | null;
  nameTr?: string | null;
};

export const MENU_NAME_FIELD_BY_LANG: Record<
  MenuAutoTranslateLang,
  keyof Omit<MenuNameFields, "nameGr">
> = {
  EN: "nameEn",
  DE: "nameDe",
  FR: "nameFr",
  PL: "namePl",
  CS: "nameCs",
  IT: "nameIt",
  SV: "nameSv",
  FI: "nameFi",
  TR: "nameTr",
};

export function readMenuNameField(
  input: MenuNameFields,
  lang: MenuAutoTranslateLang,
): string | undefined {
  const raw = input[MENU_NAME_FIELD_BY_LANG[lang]];
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

type TranslationRow = { language: string; name?: string | null };

/** Μετατρέπει DB translations σε MenuNameFields (null αν λείπει ελληνικό όνομα). */
export function menuNameFieldsFromTranslations(translations: TranslationRow[]): MenuNameFields | null {
  const gr = translations.find((t) => t.language === "GR")?.name?.trim();
  if (!gr) return null;

  const fields: MenuNameFields = { nameGr: gr };
  for (const t of translations) {
    const lang = t.language as MenuAutoTranslateLang;
    const field = MENU_NAME_FIELD_BY_LANG[lang];
    if (field) {
      (fields as Record<string, string | undefined>)[field] = t.name?.trim() || undefined;
    }
  }
  return fields;
}

/** Γλώσσες auto-translate που λείπουν από DB row (χρειάζεται GR source). */
export function missingAutoTranslateLanguagesFromRows(translations: TranslationRow[]): MenuAutoTranslateLang[] {
  const fields = menuNameFieldsFromTranslations(translations);
  if (!fields) return [];
  return MENU_AUTO_TRANSLATE_LANGS.filter((lang) => !readMenuNameField(fields, lang));
}
