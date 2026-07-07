import {
  mergeAutoTranslatedNames,
  missingMenuNameLanguages,
  type MenuAutoTranslateLang,
  type MenuNameFields,
} from "@menuos/shared";

const DEEPL_TARGET: Record<MenuAutoTranslateLang, string> = {
  EN: "EN",
  DE: "DE",
  FR: "FR",
  PL: "PL",
  CS: "CS",
  IT: "IT",
  SV: "SV",
  FI: "FI",
  TR: "TR",
};

const MYMEMORY_TARGET: Record<MenuAutoTranslateLang, string> = {
  EN: "en",
  DE: "de",
  FR: "fr",
  PL: "pl",
  CS: "cs",
  IT: "it",
  SV: "sv",
  FI: "fi",
  TR: "tr",
};

function deeplApiUrl(): string {
  return process.env.DEEPL_API_URL?.trim() || "https://api-free.deepl.com/v2/translate";
}

async function translateWithDeepL(text: string, target: MenuAutoTranslateLang): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) return null;

  const body = new URLSearchParams({
    auth_key: apiKey,
    text,
    source_lang: "EL",
    target_lang: DEEPL_TARGET[target],
  });

  const res = await fetch(deeplApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { translations?: Array<{ text?: string }> };
  const translated = data.translations?.[0]?.text?.trim();
  return translated || null;
}

async function translateWithMyMemory(text: string, target: MenuAutoTranslateLang): Promise<string | null> {
  const langpair = `el|${MYMEMORY_TARGET[target]}`;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);

  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };

  if (data.responseStatus && data.responseStatus !== 200) return null;

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) return null;
  if (translated.toUpperCase() === text.toUpperCase()) return null;
  return translated;
}

async function translateOne(text: string, target: MenuAutoTranslateLang): Promise<string | null> {
  try {
    const deepl = await translateWithDeepL(text, target);
    if (deepl) return deepl;
  } catch {
    /* fallback */
  }

  try {
    return await translateWithMyMemory(text, target);
  } catch {
    return null;
  }
}

/** Μετάφραση ενός κειμένου από ελληνικά (μόνο για τα requested targets). */
export async function translateMenuTextFromGreek(
  text: string,
  targets: MenuAutoTranslateLang[],
  maxLength = 120,
): Promise<Partial<Record<MenuAutoTranslateLang, string>>> {
  const trimmed = text.trim();
  if (!trimmed || targets.length === 0) return {};

  const uniqueTargets = [...new Set(targets)];
  const entries = await Promise.all(
    uniqueTargets.map(async (lang) => {
      const translated = await translateOne(trimmed, lang);
      if (!translated) return null;
      return [lang, translated.slice(0, maxLength)] as const;
    }),
  );

  return Object.fromEntries(entries.filter(Boolean) as Array<[MenuAutoTranslateLang, string]>) as Partial<
    Record<MenuAutoTranslateLang, string>
  >;
}

/** Συμπληρώνει κενά name* από αυτόματη μετάφραση του nameGr. */
export async function autoFillMenuNames(input: MenuNameFields): Promise<
  Required<Pick<MenuNameFields, "nameGr">> & Omit<MenuNameFields, "nameGr">
> {
  const missing = missingMenuNameLanguages(input);
  if (missing.length === 0) {
    return mergeAutoTranslatedNames(input, {});
  }

  const translated = await translateMenuTextFromGreek(input.nameGr, missing);
  return mergeAutoTranslatedNames(input, translated);
}

/** Backfill missing translation rows for one Greek name. */
export async function autoFillMenuNamesFromGreek(
  nameGr: string,
  existing?: Partial<MenuNameFields>,
): Promise<Required<Pick<MenuNameFields, "nameGr">> & Omit<MenuNameFields, "nameGr">> {
  return autoFillMenuNames({ nameGr, ...existing });
}
