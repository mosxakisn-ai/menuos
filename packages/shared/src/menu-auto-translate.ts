export type MenuNameFields = {
  nameGr: string;
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
};

export type MenuNameLang = "EN" | "DE" | "FR";

const LANG_TO_FIELD: Record<MenuNameLang, keyof MenuNameFields> = {
  EN: "nameEn",
  DE: "nameDe",
  FR: "nameFr",
};

/** Γλώσσες που λείπουν και πρέπει να συμπληρωθούν αυτόματα. */
export function missingMenuNameLanguages(input: MenuNameFields): MenuNameLang[] {
  const gr = input.nameGr.trim();
  if (!gr) return [];

  return (["EN", "DE", "FR"] as const).filter((lang) => {
    const field = LANG_TO_FIELD[lang];
    return !input[field]?.trim();
  });
}

export function mergeAutoTranslatedNames(
  input: MenuNameFields,
  translated: Partial<Record<MenuNameLang, string>>,
): Required<Pick<MenuNameFields, "nameGr">> &
  Pick<MenuNameFields, "nameEn" | "nameDe" | "nameFr"> {
  return {
    nameGr: input.nameGr.trim(),
    nameEn: input.nameEn?.trim() || translated.EN?.trim() || undefined,
    nameDe: input.nameDe?.trim() || translated.DE?.trim() || undefined,
    nameFr: input.nameFr?.trim() || translated.FR?.trim() || undefined,
  };
}
