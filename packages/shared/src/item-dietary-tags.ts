import type { QrMenuLanguage } from "./menu-languages";

export const DIETARY_TAGS = [
  "VEGETARIAN",
  "VEGAN",
  "GLUTEN_FREE",
  "DAIRY_FREE",
  "SPICY",
  "HALAL",
  "KIDS",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const DIETARY_TAG_OPTIONS: { value: DietaryTag; dashboardGr: string }[] = [
  { value: "VEGETARIAN", dashboardGr: "Χορτοφαγικό" },
  { value: "VEGAN", dashboardGr: "Vegan" },
  { value: "GLUTEN_FREE", dashboardGr: "Χωρίς γλουτένη" },
  { value: "DAIRY_FREE", dashboardGr: "Χωρίς γαλακτοκομικά" },
  { value: "SPICY", dashboardGr: "Πικάντικο" },
  { value: "HALAL", dashboardGr: "Halal" },
  { value: "KIDS", dashboardGr: "Παιδικό" },
];

export const DIETARY_TAG_UI: Record<DietaryTag, Partial<Record<QrMenuLanguage, string>>> = {
  VEGETARIAN: { GR: "Χορτοφαγικό", EN: "Vegetarian", DE: "Vegetarisch", FR: "Végétarien" },
  VEGAN: { GR: "Vegan", EN: "Vegan", DE: "Vegan", FR: "Vegan" },
  GLUTEN_FREE: { GR: "Χωρίς γλουτένη", EN: "Gluten-free", DE: "Glutenfrei", FR: "Sans gluten" },
  DAIRY_FREE: {
    GR: "Χωρίς γαλακτοκομικά",
    EN: "Dairy-free",
    DE: "Laktosefrei",
    FR: "Sans lactose",
  },
  SPICY: { GR: "Πικάντικο", EN: "Spicy", DE: "Scharf", FR: "Épicé" },
  HALAL: { GR: "Halal", EN: "Halal", DE: "Halal", FR: "Halal" },
  KIDS: { GR: "Παιδικό", EN: "Kids", DE: "Kinder", FR: "Enfant" },
};

/** Lucide icon names for QR/dashboard rendering. */
export const DIETARY_TAG_ICONS: Record<DietaryTag, string> = {
  VEGETARIAN: "Leaf",
  VEGAN: "Sprout",
  GLUTEN_FREE: "WheatOff",
  DAIRY_FREE: "MilkOff",
  SPICY: "Flame",
  HALAL: "Moon",
  KIDS: "Baby",
};

export const DIETARY_TAG_PILL_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700";

export function isDietaryTag(value: string): value is DietaryTag {
  return (DIETARY_TAGS as readonly string[]).includes(value);
}

export function dietaryTagText(tag: DietaryTag, lang: QrMenuLanguage): string {
  const row = DIETARY_TAG_UI[tag];
  return row[lang] ?? row.EN ?? row.GR ?? tag;
}

export function parseDietaryTags(value: unknown): DietaryTag[] {
  if (!Array.isArray(value)) return [];
  const out: DietaryTag[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && isDietaryTag(entry) && !out.includes(entry)) {
      out.push(entry);
    }
  }
  return out;
}
