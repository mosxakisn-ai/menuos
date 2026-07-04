/** Footer hub links — kept separate from seo-landing.ts so client bundles skip LANDINGS (~103 configs). */
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
    {
      href: "/nafplio/estiatorio/qr-menu",
      labelEl: "Εστιατόριο · Ναύπλιο",
      labelEn: "Restaurant · Nafplio",
    },
    {
      href: "/kefalonia/beach-bar/qr-menu",
      labelEl: "Beach bar · Κεφαλονιά",
      labelEn: "Beach bar · Kefalonia",
    },
  ] as const,
  verticals: [
    { href: "/live-360", labelEl: "Live 360° · συντονισμός", labelEn: "Live 360° · coordination" },
    { href: "/estiatorio/qr-menu", labelEl: "Εστιατόριο · QR menu", labelEn: "Restaurant · QR menu" },
    { href: "/taverna/qr-menu", labelEl: "Ταβέρνα · QR menu", labelEn: "Taverna · QR menu" },
    { href: "/pizzeria/qr-menu", labelEl: "Πιτσαρία · QR menu", labelEn: "Pizzeria · QR menu" },
    { href: "/cafe/qr-menu", labelEl: "Café · QR menu", labelEn: "Café · QR menu" },
    { href: "/xenodocheio/digital-menu", labelEl: "Ξενοδοχείο · digital menu", labelEn: "Hotel · digital menu" },
    { href: "/beach-bar/qr-menu", labelEl: "Beach bar · QR menu", labelEn: "Beach bar · QR menu" },
    { href: "/pool-bar/digital-menu", labelEl: "Pool bar · digital menu", labelEn: "Pool bar · digital menu" },
    { href: "/room-service/qr-menu", labelEl: "Room service · QR menu", labelEn: "Room service · QR menu" },
    { href: "/spa-menu", labelEl: "Spa · menu QR", labelEn: "Spa · menu QR" },
  ] as const,
} as const;
