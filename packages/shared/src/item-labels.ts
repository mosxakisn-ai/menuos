import type { QrMenuLanguage } from "./menu-languages";

export const ITEM_LABELS = ["OFFER", "BEST", "NEW", "CHEF", "SEASONAL", "RECOMMENDED"] as const;
export type ItemLabel = (typeof ITEM_LABELS)[number];

export const ITEM_LABEL_OPTIONS: { value: ItemLabel; dashboardGr: string }[] = [
  { value: "OFFER", dashboardGr: "Προσφορά" },
  { value: "BEST", dashboardGr: "Δημοφιλές" },
  { value: "NEW", dashboardGr: "Νέο πιάτο" },
  { value: "CHEF", dashboardGr: "Επιλογή σεφ" },
  { value: "SEASONAL", dashboardGr: "Εποχιακό" },
  { value: "RECOMMENDED", dashboardGr: "Προτείνεται" },
];

export const ITEM_LABEL_UI: Record<ItemLabel, Partial<Record<QrMenuLanguage, string>>> = {
  OFFER: { GR: "Προσφορά", EN: "Offer", DE: "Angebot", FR: "Offre" },
  BEST: { GR: "Δημοφιλές", EN: "Popular", DE: "Beliebt", FR: "Populaire" },
  NEW: { GR: "Νέο", EN: "New", DE: "Neu", FR: "Nouveau" },
  CHEF: { GR: "Επιλογή σεφ", EN: "Chef's choice", DE: "Empfehlung des Küchenchefs", FR: "Choix du chef" },
  SEASONAL: { GR: "Εποχιακό", EN: "Seasonal", DE: "Saisonal", FR: "De saison" },
  RECOMMENDED: { GR: "Προτείνεται", EN: "Recommended", DE: "Empfohlen", FR: "Recommandé" },
};

/** Lucide icon names for badge pills. */
export const ITEM_LABEL_ICONS: Record<ItemLabel, string> = {
  OFFER: "Tag",
  BEST: "Award",
  NEW: "Sparkles",
  CHEF: "ChefHat",
  SEASONAL: "Sun",
  RECOMMENDED: "ThumbsUp",
};

/** Tailwind classes for badge pill on menu cards. */
export const ITEM_LABEL_STYLES: Record<ItemLabel, string> = {
  OFFER: "bg-amber-500 text-white shadow-sm",
  BEST: "bg-brand-blue text-white shadow-sm",
  NEW: "bg-emerald-500 text-white shadow-sm",
  CHEF: "bg-violet-600 text-white shadow-sm",
  SEASONAL: "bg-orange-500 text-white shadow-sm",
  RECOMMENDED: "bg-cyan-600 text-white shadow-sm",
};

export function itemLabelText(label: ItemLabel, lang: QrMenuLanguage): string {
  const row = ITEM_LABEL_UI[label];
  return row[lang] ?? row.EN ?? row.GR ?? label;
}

export function isItemLabel(value: string | null | undefined): value is ItemLabel {
  return value != null && (ITEM_LABELS as readonly string[]).includes(value);
}
