/** Config-driven SEO landing pages (vertical × city × product). */

export type SeoProductSlug = "qr-menu" | "digital-menu";

export type SeoVerticalSlug =
  | "estiatorio"
  | "xenodocheio"
  | "beach-bar"
  | "pool-bar"
  | "room-service"
  | "spa";

export type SeoCitySlug =
  | "rodos"
  | "santorini"
  | "athina"
  | "thessaloniki"
  | "korfu"
  | "kriti"
  | "mykonos"
  | "paros";

export type SeoLandingKind = "product" | "vertical" | "city" | "city-vertical";

export type SeoLandingConfig = {
  kind: SeoLandingKind;
  path: string;
  product: SeoProductSlug;
  vertical?: SeoVerticalSlug;
  city?: SeoCitySlug;
};

function landing(config: SeoLandingConfig): SeoLandingConfig {
  return config;
}

/** Curated landings — quality over bulk (Phase 1b). */
const LANDINGS: SeoLandingConfig[] = [
  landing({ kind: "product", path: "/digital-menu", product: "digital-menu" }),

  landing({ kind: "vertical", path: "/estiatorio/qr-menu", product: "qr-menu", vertical: "estiatorio" }),
  landing({
    kind: "vertical",
    path: "/xenodocheio/digital-menu",
    product: "digital-menu",
    vertical: "xenodocheio",
  }),
  landing({ kind: "vertical", path: "/beach-bar/qr-menu", product: "qr-menu", vertical: "beach-bar" }),
  landing({ kind: "vertical", path: "/pool-bar/digital-menu", product: "digital-menu", vertical: "pool-bar" }),
  landing({ kind: "vertical", path: "/room-service/qr-menu", product: "qr-menu", vertical: "room-service" }),
  landing({ kind: "vertical", path: "/spa-menu", product: "digital-menu", vertical: "spa" }),

  landing({ kind: "city", path: "/rodos/qr-menu", product: "qr-menu", city: "rodos" }),
  landing({ kind: "city", path: "/santorini/digital-menu", product: "digital-menu", city: "santorini" }),
  landing({ kind: "city", path: "/athina/qr-menu", product: "qr-menu", city: "athina" }),
  landing({ kind: "city", path: "/thessaloniki/qr-menu", product: "qr-menu", city: "thessaloniki" }),
  landing({ kind: "city", path: "/korfu/digital-menu", product: "digital-menu", city: "korfu" }),
  landing({ kind: "city", path: "/kriti/qr-menu", product: "qr-menu", city: "kriti" }),
  landing({ kind: "city", path: "/mykonos/qr-menu", product: "qr-menu", city: "mykonos" }),
  landing({ kind: "city", path: "/paros/qr-menu", product: "qr-menu", city: "paros" }),

  landing({
    kind: "city-vertical",
    path: "/rodos/estiatorio/qr-menu",
    product: "qr-menu",
    city: "rodos",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/santorini/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "santorini",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/athina/beach-bar/qr-menu",
    product: "qr-menu",
    city: "athina",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/korfu/estiatorio/qr-menu",
    product: "qr-menu",
    city: "korfu",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/kriti/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "kriti",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/mykonos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "mykonos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/thessaloniki/estiatorio/qr-menu",
    product: "qr-menu",
    city: "thessaloniki",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/paros/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "paros",
    vertical: "xenodocheio",
  }),
];

const LANDING_BY_PATH = new Map(LANDINGS.map((entry) => [entry.path, entry]));

export function getAllSeoLandingPaths(): string[] {
  return LANDINGS.map((entry) => entry.path);
}

export function getAllSeoLandingSlugParams(): string[][] {
  return LANDINGS.map((entry) => entry.path.replace(/^\//, "").split("/"));
}

export function resolveSeoLandingFromSlug(slug: string[]): SeoLandingConfig | null {
  if (!slug.length) return null;
  const path = `/${slug.join("/")}`;
  return LANDING_BY_PATH.get(path) ?? null;
}

/** Footer hub — τοπικοί οδηγοί (περιοχή + κλάδος), όχι γενικό «QR menu Ρόδος». */
export const SEO_FOOTER_HUB = {
  local: [
    {
      href: "/rodos/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Ρόδος",
      labelEn: "Restaurant · Rhodes",
    },
    {
      href: "/mykonos/beach-bar/qr-menu",
      labelEl: "Beach bar · Μύκονος",
      labelEn: "Beach bar · Mykonos",
    },
    {
      href: "/santorini/xenodocheio/digital-menu",
      labelEl: "Ξενοδοχείο · Σαντορίνη",
      labelEn: "Hotel · Santorini",
    },
    {
      href: "/kriti/xenodocheio/digital-menu",
      labelEl: "Ξενοδοχείο · Κρήτη",
      labelEn: "Hotel · Crete",
    },
    {
      href: "/paros/xenodocheio/digital-menu",
      labelEl: "Ξενοδοχείο · Πάρος",
      labelEn: "Hotel · Paros",
    },
    {
      href: "/athina/beach-bar/qr-menu",
      labelEl: "Beach bar · Αθήνα",
      labelEn: "Beach bar · Athens",
    },
    {
      href: "/thessaloniki/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Θεσσαλονίκη",
      labelEn: "Restaurant · Thessaloniki",
    },
    {
      href: "/korfu/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Κέρκυρα",
      labelEn: "Restaurant · Corfu",
    },
  ] as const,
  verticals: [
    { href: "/estiatorio/qr-menu", labelEl: "Εστιατόριο · QR menu", labelEn: "Restaurant · QR menu" },
    { href: "/xenodocheio/digital-menu", labelEl: "Ξενοδοχείο · digital menu", labelEn: "Hotel · digital menu" },
    { href: "/beach-bar/qr-menu", labelEl: "Beach bar · QR menu", labelEn: "Beach bar · QR menu" },
    { href: "/pool-bar/digital-menu", labelEl: "Pool bar · digital menu", labelEn: "Pool bar · digital menu" },
    { href: "/room-service/qr-menu", labelEl: "Room service · QR menu", labelEn: "Room service · QR menu" },
    { href: "/spa-menu", labelEl: "Spa · menu QR", labelEn: "Spa · menu QR" },
  ] as const,
} as const;
