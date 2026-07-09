import type { QrMenuLanguage } from "./menu-languages";

/** EU Regulation 1169/2011 Annex II — canonical codes. */
export const ALLERGEN_CODES = [
  "GLUTEN",
  "MILK",
  "EGGS",
  "FISH",
  "CRUSTACEANS",
  "PEANUTS",
  "SOY",
  "NUTS",
  "CELERY",
  "MUSTARD",
  "SESAME",
  "SULPHITES",
  "LUPIN",
  "MOLLUSCS",
] as const;

export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const ALLERGEN_CODE_OPTIONS: { value: AllergenCode; dashboardGr: string }[] = [
  { value: "GLUTEN", dashboardGr: "Γλουτένη" },
  { value: "MILK", dashboardGr: "Γαλακτοκομικά" },
  { value: "EGGS", dashboardGr: "Αυγά" },
  { value: "FISH", dashboardGr: "Ψάρια" },
  { value: "CRUSTACEANS", dashboardGr: "Οστρακοειδή" },
  { value: "PEANUTS", dashboardGr: "Αραχίδες" },
  { value: "SOY", dashboardGr: "Σόγια" },
  { value: "NUTS", dashboardGr: "Ξηροί καρποί" },
  { value: "CELERY", dashboardGr: "Σέλινο" },
  { value: "MUSTARD", dashboardGr: "Σινάπι" },
  { value: "SESAME", dashboardGr: "Σουσάμι" },
  { value: "SULPHITES", dashboardGr: "Θειώδη" },
  { value: "LUPIN", dashboardGr: "Λούπινο" },
  { value: "MOLLUSCS", dashboardGr: "Μαλακία" },
];

export const ALLERGEN_CODE_UI: Record<AllergenCode, Partial<Record<QrMenuLanguage, string>>> = {
  GLUTEN: { GR: "Γλουτένη", EN: "Gluten", DE: "Gluten", FR: "Gluten" },
  MILK: { GR: "Γαλακτοκομικά", EN: "Milk", DE: "Milch", FR: "Lait" },
  EGGS: { GR: "Αυγά", EN: "Eggs", DE: "Eier", FR: "Œufs" },
  FISH: { GR: "Ψάρια", EN: "Fish", DE: "Fisch", FR: "Poisson" },
  CRUSTACEANS: { GR: "Οστρακοειδή", EN: "Crustaceans", DE: "Krebstiere", FR: "Crustacés" },
  PEANUTS: { GR: "Αραχίδες", EN: "Peanuts", DE: "Erdnüsse", FR: "Arachides" },
  SOY: { GR: "Σόγια", EN: "Soy", DE: "Soja", FR: "Soja" },
  NUTS: { GR: "Ξηροί καρποί", EN: "Nuts", DE: "Nüsse", FR: "Fruits à coque" },
  CELERY: { GR: "Σέλινο", EN: "Celery", DE: "Sellerie", FR: "Céleri" },
  MUSTARD: { GR: "Σινάπι", EN: "Mustard", DE: "Senf", FR: "Moutarde" },
  SESAME: { GR: "Σουσάμι", EN: "Sesame", DE: "Sesam", FR: "Sésame" },
  SULPHITES: { GR: "Θειώδη", EN: "Sulphites", DE: "Sulfite", FR: "Sulfites" },
  LUPIN: { GR: "Λούπινο", EN: "Lupin", DE: "Lupinen", FR: "Lupin" },
  MOLLUSCS: { GR: "Μαλακία", EN: "Molluscs", DE: "Weichtiere", FR: "Mollusques" },
};

export const ALLERGEN_CODE_PILL_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50/80 px-2 py-0.5 text-[10px] font-medium text-rose-800";

export function isAllergenCode(value: string): value is AllergenCode {
  return (ALLERGEN_CODES as readonly string[]).includes(value);
}

export function allergenCodeText(code: AllergenCode, lang: QrMenuLanguage): string {
  const row = ALLERGEN_CODE_UI[code];
  return row[lang] ?? row.EN ?? row.GR ?? code;
}

export function parseAllergenCodes(value: unknown): AllergenCode[] {
  if (!Array.isArray(value)) return [];
  const out: AllergenCode[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && isAllergenCode(entry) && !out.includes(entry)) {
      out.push(entry);
    }
  }
  return out;
}
