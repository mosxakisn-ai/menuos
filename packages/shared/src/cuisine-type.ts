import type { QrMenuLanguage } from "./menu-languages";

export const CUISINE_TYPES = [
  "MEDITERRANEAN",
  "GREEK",
  "ITALIAN",
  "GOURMET",
  "SEAFOOD",
  "GRILL",
  "CAFE_BAR",
  "ASIAN",
  "INTERNATIONAL",
  "VEGETARIAN",
  "OTHER",
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

const QR_LABELS: Record<CuisineType, Partial<Record<QrMenuLanguage, string>>> = {
  MEDITERRANEAN: {
    GR: "Μεσογειακή κουζίνα",
    EN: "Mediterranean cuisine",
    DE: "Mediterrane Küche",
    FR: "Cuisine méditerranéenne",
  },
  GREEK: {
    GR: "Ελληνική κουζίνα",
    EN: "Greek cuisine",
    DE: "Griechische Küche",
    FR: "Cuisine grecque",
  },
  ITALIAN: {
    GR: "Ιταλική κουζίνα",
    EN: "Italian cuisine",
    DE: "Italienische Küche",
    FR: "Cuisine italienne",
  },
  GOURMET: {
    GR: "Gourmet",
    EN: "Gourmet",
    DE: "Gourmet",
    FR: "Gourmet",
  },
  SEAFOOD: {
    GR: "Θαλασσινά",
    EN: "Seafood",
    DE: "Meeresfrüchte",
    FR: "Fruits de mer",
  },
  GRILL: {
    GR: "Ψητά & grill",
    EN: "Grill",
    DE: "Grill",
    FR: "Grillades",
  },
  CAFE_BAR: {
    GR: "Café & bar",
    EN: "Café & bar",
    DE: "Café & Bar",
    FR: "Café & bar",
  },
  ASIAN: {
    GR: "Ασιατική κουζίνα",
    EN: "Asian cuisine",
    DE: "Asiatische Küche",
    FR: "Cuisine asiatique",
  },
  INTERNATIONAL: {
    GR: "Διεθνής κουζίνα",
    EN: "International cuisine",
    DE: "Internationale Küche",
    FR: "Cuisine internationale",
  },
  VEGETARIAN: {
    GR: "Vegetarian / vegan",
    EN: "Vegetarian / vegan",
    DE: "Vegetarisch / vegan",
    FR: "Végétarien / vegan",
  },
  OTHER: {
    GR: "Άλλο στυλ",
    EN: "Other style",
    DE: "Anderes Konzept",
    FR: "Autre style",
  },
};

export function isCuisineType(value: string): value is CuisineType {
  return (CUISINE_TYPES as readonly string[]).includes(value);
}

export function cuisineTypeQrLabel(
  type: CuisineType,
  language: QrMenuLanguage,
): string {
  const labels = QR_LABELS[type];
  return labels[language] ?? labels.EN ?? labels.GR ?? type;
}
