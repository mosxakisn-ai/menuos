import type { QrMenuLanguage } from "./menu-languages";

export const ITEM_LABELS = ["OFFER", "BEST", "NEW"] as const;
export type ItemLabel = (typeof ITEM_LABELS)[number];

export const ITEM_LABEL_OPTIONS: { value: ItemLabel; dashboardGr: string }[] = [
  { value: "OFFER", dashboardGr: "Προσφορά" },
  { value: "BEST", dashboardGr: "Best seller" },
  { value: "NEW", dashboardGr: "Νέο πιάτο" },
];

export const ITEM_LABEL_UI: Record<ItemLabel, Record<QrMenuLanguage, string>> = {
  OFFER: { GR: "Προσφορά", EN: "Offer", DE: "Angebot", FR: "Offre" },
  BEST: { GR: "Best seller", EN: "Best seller", DE: "Bestseller", FR: "Best seller" },
  NEW: { GR: "Νέο", EN: "New", DE: "Neu", FR: "Nouveau" },
};

/** Tailwind classes for badge pill on menu cards. */
export const ITEM_LABEL_STYLES: Record<ItemLabel, string> = {
  OFFER: "bg-amber-500 text-white shadow-sm",
  BEST: "bg-brand-blue text-white shadow-sm",
  NEW: "bg-emerald-500 text-white shadow-sm",
};

export function itemLabelText(label: ItemLabel, lang: QrMenuLanguage): string {
  return ITEM_LABEL_UI[label][lang];
}

export function isItemLabel(value: string | null | undefined): value is ItemLabel {
  return value != null && (ITEM_LABELS as readonly string[]).includes(value);
}
