/** Onboarding starter pack — keep in sync with packages/shared/src/onboarding-starter-data.ts */
import { DEMO_PHOTOS } from "./demo-photos.mjs";

export const DEMO_ORG_SLUG = "menuos-master";
export const DEMO_VENUE_SLUG = "demo-taverna";

export const ONBOARDING_ITEM_PHOTOS = DEMO_PHOTOS;

export const ONBOARDING_STARTER_CATEGORIES = [
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

export const ONBOARDING_STARTER_SPOTS: { type: "TABLE" | "SUNBED" | "ROOM"; label: string }[] = [];

export const ONBOARDING_STARTER_STAFF: {
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
};

export const ONBOARDING_EXTRA_STATION_SCREEN = {
  station: "BAR",
  label: "Παραλία",
  spotPrefix: "Αυλή",
};

export function shouldSeedOnboardingVenue(orgSlug, venueSlug) {
  if (venueSlug === DEMO_VENUE_SLUG) return false;
  if (orgSlug === DEMO_ORG_SLUG) return false;
  return true;
}
