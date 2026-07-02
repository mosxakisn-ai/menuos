import { DEMO_ORG_SLUG, DEMO_VENUE_SLUG } from "./demo-venue";

export { DEMO_ORG_SLUG, DEMO_VENUE_SLUG };

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=675&q=85`;

/** Sample dish photos (same curated set as demo-taverna). */
export const ONBOARDING_ITEM_PHOTOS: Record<string, string> = {
  Χωριάτικη: unsplash("photo-1592417817098-8fd3d9eb14a5"),
  Ρόκα: unsplash("photo-1546069901-ba9599a7e63c"),
  Μουσακάς: unsplash("photo-1596797038530-2c107229654b"),
  "Σουβλάκι χοιρινό": unsplash("photo-1559847844-5315695dadae"),
  "Ψητή τσιπούρα": unsplash("photo-1751094069288-a2bcef5eb6c8"),
  Μπύρα: unsplash("photo-1608270586620-248524c67de9"),
  "Κρασί κόκκινο (ποτήρι)": unsplash("photo-1553361371-9b22f78e8b1d"),
};

export type OnboardingStarterCategory = {
  nameGr: string;
  nameEn: string;
  nameDe?: string;
  nameFr?: string;
  items: {
    nameGr: string;
    nameEn: string;
    nameDe?: string;
    nameFr?: string;
    price: number;
    descriptionGr?: string;
  }[];
};

export const ONBOARDING_STARTER_CATEGORIES: OnboardingStarterCategory[] = [
  {
    nameGr: "Σαλάτες",
    nameEn: "Salads",
    nameDe: "Salate",
    nameFr: "Salades",
    items: [
      {
        nameGr: "Χωριάτικη",
        nameEn: "Greek salad",
        nameDe: "Griechischer Salat",
        nameFr: "Salade grecque",
        price: 9.5,
        descriptionGr: "Ντομάτα, αγγούρι, φέτα",
      },
      {
        nameGr: "Ρόκα",
        nameEn: "Rocket salad",
        nameDe: "Rucolasalat",
        nameFr: "Salade de roquette",
        price: 8.0,
      },
    ],
  },
  {
    nameGr: "Κυρίως πιάτα",
    nameEn: "Mains",
    nameDe: "Hauptgerichte",
    nameFr: "Plats",
    items: [
      {
        nameGr: "Μουσακάς",
        nameEn: "Moussaka",
        nameDe: "Moussaka",
        nameFr: "Moussaka",
        price: 12.0,
        descriptionGr: "Κλασική συνταγή",
      },
      {
        nameGr: "Σουβλάκι χοιρινό",
        nameEn: "Pork souvlaki",
        nameDe: "Schweine-Souvlaki",
        nameFr: "Souvlaki porc",
        price: 10.5,
      },
      {
        nameGr: "Ψητή τσιπούρα",
        nameEn: "Grilled sea bream",
        nameDe: "Gebratene Dorade",
        nameFr: "Daurade grillée",
        price: 18.0,
      },
    ],
  },
  {
    nameGr: "Ποτά",
    nameEn: "Drinks",
    nameDe: "Getränke",
    nameFr: "Boissons",
    items: [
      {
        nameGr: "Μπύρα",
        nameEn: "Beer",
        nameDe: "Bier",
        nameFr: "Bière",
        price: 4.5,
      },
      {
        nameGr: "Κρασί κόκκινο (ποτήρι)",
        nameEn: "Red wine (glass)",
        nameDe: "Rotwein (Glas)",
        nameFr: "Vin rouge (verre)",
        price: 5.0,
      },
    ],
  },
];

export const ONBOARDING_STARTER_SPOTS: { type: "TABLE" | "SUNBED" | "ROOM"; label: string }[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ type: "TABLE" as const, label: String(i + 1) })),
  { type: "TABLE", label: "Αυλή-1" },
  { type: "TABLE", label: "Αυλή-2" },
  { type: "SUNBED", label: "paralia-1" },
  { type: "SUNBED", label: "paralia-2" },
  { type: "ROOM", label: "101" },
  { type: "ROOM", label: "102" },
];

export const ONBOARDING_STARTER_STAFF: {
  name: string;
  roleLabel: string;
  stations: string[];
}[] = [
  { name: "Μαρία Π.", roleLabel: "Σερβιτόρος", stations: ["services"] },
  { name: "Γιώργος Κ.", roleLabel: "Σερβιτόρος", stations: ["services"] },
  { name: "Νίκος Α.", roleLabel: "Μάγειρας", stations: ["kitchen"] },
  { name: "Ελένη Μ.", roleLabel: "Μπαρ", stations: ["bar"] },
  { name: "Κώστας Δ.", roleLabel: "Manager", stations: ["all"] },
];

export const ONBOARDING_OPENING_HOURS = {
  mon: "12:00–00:00",
  tue: "12:00–00:00",
  wed: "12:00–00:00",
  thu: "12:00–00:00",
  fri: "12:00–01:00",
  sat: "12:00–01:00",
  sun: "12:00–00:00",
} as const;

/** Extra bar screen illustrating zone-filtered passes (Αυλή-* tables). */
export const ONBOARDING_EXTRA_STATION_SCREEN = {
  station: "BAR" as const,
  label: "Παραλία",
  spotPrefix: "Αυλή",
};

export function shouldSeedOnboardingVenue(orgSlug: string, venueSlug: string): boolean {
  if (venueSlug === DEMO_VENUE_SLUG) return false;
  if (orgSlug === DEMO_ORG_SLUG) return false;
  return true;
}

export function countOnboardingStarterItems(): number {
  return ONBOARDING_STARTER_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
}
