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
  | "paros"
  | "naxos"
  | "zakynthos"
  | "chania"
  | "kos"
  | "lefkada"
  | "halkidiki"
  | "ios"
  | "skiathos"
  | "kalamata"
  | "patra"
  | "ioannina"
  | "kavala"
  | "milos"
  | "rethymno"
  | "iraklio"
  | "sifnos"
  | "larisa"
  | "volos";

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

  landing({ kind: "city", path: "/naxos/qr-menu", product: "qr-menu", city: "naxos" }),
  landing({ kind: "city", path: "/zakynthos/digital-menu", product: "digital-menu", city: "zakynthos" }),
  landing({ kind: "city", path: "/chania/qr-menu", product: "qr-menu", city: "chania" }),
  landing({ kind: "city", path: "/kos/digital-menu", product: "digital-menu", city: "kos" }),
  landing({ kind: "city", path: "/lefkada/qr-menu", product: "qr-menu", city: "lefkada" }),
  landing({ kind: "city", path: "/halkidiki/digital-menu", product: "digital-menu", city: "halkidiki" }),
  landing({ kind: "city", path: "/ios/qr-menu", product: "qr-menu", city: "ios" }),
  landing({ kind: "city", path: "/skiathos/digital-menu", product: "digital-menu", city: "skiathos" }),
  landing({ kind: "city", path: "/kalamata/qr-menu", product: "qr-menu", city: "kalamata" }),
  landing({ kind: "city", path: "/patra/digital-menu", product: "digital-menu", city: "patra" }),
  landing({ kind: "city", path: "/ioannina/qr-menu", product: "qr-menu", city: "ioannina" }),
  landing({ kind: "city", path: "/kavala/digital-menu", product: "digital-menu", city: "kavala" }),

  landing({
    kind: "city-vertical",
    path: "/rodos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "rodos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/santorini/estiatorio/qr-menu",
    product: "qr-menu",
    city: "santorini",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/kriti/estiatorio/qr-menu",
    product: "qr-menu",
    city: "kriti",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/mykonos/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "mykonos",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/naxos/estiatorio/qr-menu",
    product: "qr-menu",
    city: "naxos",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/zakynthos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "zakynthos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/chania/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "chania",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/chania/estiatorio/qr-menu",
    product: "qr-menu",
    city: "chania",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/kos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "kos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/lefkada/estiatorio/qr-menu",
    product: "qr-menu",
    city: "lefkada",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/halkidiki/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "halkidiki",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/ios/beach-bar/qr-menu",
    product: "qr-menu",
    city: "ios",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/skiathos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "skiathos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/kalamata/estiatorio/qr-menu",
    product: "qr-menu",
    city: "kalamata",
    vertical: "estiatorio",
  }),

  landing({
    kind: "city-vertical",
    path: "/athina/estiatorio/qr-menu",
    product: "qr-menu",
    city: "athina",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/athina/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "athina",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/korfu/beach-bar/qr-menu",
    product: "qr-menu",
    city: "korfu",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/paros/beach-bar/qr-menu",
    product: "qr-menu",
    city: "paros",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/patra/estiatorio/qr-menu",
    product: "qr-menu",
    city: "patra",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/ioannina/estiatorio/qr-menu",
    product: "qr-menu",
    city: "ioannina",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/kavala/estiatorio/qr-menu",
    product: "qr-menu",
    city: "kavala",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/thessaloniki/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "thessaloniki",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/rodos/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "rodos",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/santorini/beach-bar/qr-menu",
    product: "qr-menu",
    city: "santorini",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/naxos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "naxos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/lefkada/beach-bar/qr-menu",
    product: "qr-menu",
    city: "lefkada",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/halkidiki/beach-bar/qr-menu",
    product: "qr-menu",
    city: "halkidiki",
    vertical: "beach-bar",
  }),

  landing({ kind: "city", path: "/milos/qr-menu", product: "qr-menu", city: "milos" }),
  landing({ kind: "city", path: "/rethymno/digital-menu", product: "digital-menu", city: "rethymno" }),
  landing({ kind: "city", path: "/iraklio/qr-menu", product: "qr-menu", city: "iraklio" }),
  landing({ kind: "city", path: "/sifnos/digital-menu", product: "digital-menu", city: "sifnos" }),
  landing({ kind: "city", path: "/larisa/qr-menu", product: "qr-menu", city: "larisa" }),
  landing({ kind: "city", path: "/volos/digital-menu", product: "digital-menu", city: "volos" }),

  landing({
    kind: "city-vertical",
    path: "/milos/beach-bar/qr-menu",
    product: "qr-menu",
    city: "milos",
    vertical: "beach-bar",
  }),
  landing({
    kind: "city-vertical",
    path: "/rethymno/estiatorio/qr-menu",
    product: "qr-menu",
    city: "rethymno",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/rethymno/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "rethymno",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/iraklio/xenodocheio/digital-menu",
    product: "digital-menu",
    city: "iraklio",
    vertical: "xenodocheio",
  }),
  landing({
    kind: "city-vertical",
    path: "/iraklio/estiatorio/qr-menu",
    product: "qr-menu",
    city: "iraklio",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/sifnos/estiatorio/qr-menu",
    product: "qr-menu",
    city: "sifnos",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/larisa/estiatorio/qr-menu",
    product: "qr-menu",
    city: "larisa",
    vertical: "estiatorio",
  }),
  landing({
    kind: "city-vertical",
    path: "/volos/estiatorio/qr-menu",
    product: "qr-menu",
    city: "volos",
    vertical: "estiatorio",
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
    {
      href: "/chania/xenodocheio/digital-menu",
      labelEl: "Ξενοδοχείο · Χανιά",
      labelEn: "Hotel · Chania",
    },
    {
      href: "/naxos/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Νάξος",
      labelEn: "Restaurant · Naxos",
    },
    {
      href: "/zakynthos/beach-bar/qr-menu",
      labelEl: "Beach bar · Ζάκυνθος",
      labelEn: "Beach bar · Zakynthos",
    },
    {
      href: "/iraklio/xenodocheio/digital-menu",
      labelEl: "Ξενοδοχείο · Ηράκλειο",
      labelEn: "Hotel · Heraklion",
    },
    {
      href: "/milos/beach-bar/qr-menu",
      labelEl: "Beach bar · Μήλος",
      labelEn: "Beach bar · Milos",
    },
    {
      href: "/rethymno/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Ρέθυμνο",
      labelEn: "Restaurant · Rethymno",
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
