/** Κεντρικό SEO copy — ελληνική αγορά, απλή γλώσσα, χωρίς jargon. */
export const SEO_SITE = {
  name: "MenuOS",
  locale: "el_GR",
  language: "el-GR",
  region: "GR",
  contactEmail: "info@qrmenus.info",
  contactPhone: "210 700 0925",
  contactPhoneTel: "+302107000925",
  contactFacebook: "https://www.facebook.com/MenuOs.Greece/",
  url: "https://menuos.gr",

  defaultTitle: "MenuOS — Ψηφιακό menu & Live 360° για εστιατόρια & ξενοδοχεία",
  titleTemplate: "%s | MenuOS",
  description:
    "Ψηφιακό menu με QR και live συντονισμό 360° για εστιατόρια, ξενοδοχεία και bars. Ο πελάτης σκανάρει — εσείς ενημερώνετε online σε λεπτά.",

  keywords: [
    "QR menu",
    "ψηφιακό menu",
    "digital menu εστιατόριο",
    "menu QR code",
    "menu ξενοδοχείο",
    "ψηφιακός κατάλογος εστιατορίου",
    "QR menu Ελλάδα",
    "menu με QR",
    "online menu εστιατόριο",
    "beach bar menu QR",
    "room service menu",
    "πολυγλωσσικό menu",
    "Live 360",
    "live συντονισμός εστιατορίου",
    "συντονισμός σερβιτόρου",
    "ops εστιατορίου",
  ],
} as const;

export type SeoPageDef = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  breadcrumbLabel: string;
};

export const SEO_PAGES = {
  home: {
    title: "Ψηφιακό menu & Live 360° — εστιατόρια, ξενοδοχεία & bars",
    description:
      "QR menu και live συντονισμός 360° σε μία πλατφόρμα. Πολυγλωσσικό menu, κλήση σερβιτόρου, ενημέρωση τιμών online — χωρίς app για τον πελάτη. Δωρεάν δοκιμή {trialDaysGen}.",
    path: "/",
    breadcrumbLabel: "Αρχική",
    keywords: [
      "ψηφιακό menu εστιατόριο",
      "QR menu ξενοδοχείο",
      "Live 360 εστιατόριο",
      "live συντονισμός σερβιτόρου",
      "menu QR code Ελλάδα",
      "digital menu hospitality",
    ],
  },
  qrMenu: {
    title: "QR Menu & Live 360° για εστιατόρια & ξενοδοχεία",
    description:
      "QR menu με live συντονισμό 360°: οι πελάτες σκανάρουν, βλέπουν φωτογραφίες και τιμές — εσείς ενημερώνετε online και βλέπετε κλήσεις live στο panel.",
    path: "/qr-menu",
    breadcrumbLabel: "QR Menu",
    keywords: [
      "QR menu",
      "QR menu εστιατόριο",
      "QR menu ξενοδοχείο",
      "Live 360",
      "ψηφιακό menu QR",
    ],
  },
  services: {
    title: "Υπηρεσίες — Ψηφιακό menu, Live 360° & QR codes",
    description:
      "Υπηρεσίες MenuOS: ψηφιακό menu, QR codes, Live 360°, πολλαπλές γλώσσες, κλήση σερβιτόρου — για εστιατόρια και ξενοδοχεία.",
    path: "/ypiresies",
    breadcrumbLabel: "Υπηρεσίες",
    keywords: ["υπηρεσίες QR menu", "Live 360", "ψηφιακό menu SaaS", "menu platform εστιατόριο"],
  },
  howItWorks: {
    title: "Πώς λειτουργεί — QR menu & Live 360°",
    description:
      "Πώς ξεκινάτε με MenuOS: εγγραφή, κατάλογος, QR στα τραπέζια, live συντονισμός 360° για κλήσεις και παραγγελίες. Απλά βήματα για εστιατόρια και ξενοδοχεία.",
    path: "/pos-leitourgei",
    breadcrumbLabel: "Πώς λειτουργεί",
    keywords: ["πώς φτιάχνω QR menu", "Live 360", "QR menu βήματα", "ψηφιακό menu οδηγός"],
  },
  pricing: {
    title: "Τιμές — QR menu & Live 360° από {basicPrice}/μήνα",
    description:
      "Τιμές MenuOS: δωρεάν δοκιμή {trialDaysGen} με Live 360°, Basic {basicPrice}/μήνα, Pro {proPrice}/μήνα. QR menu, κλήση σερβιτόρου, live panel — χωρίς κρυφές χρεώσεις.",
    path: "/pricing",
    breadcrumbLabel: "Τιμές",
    keywords: ["τιμές QR menu", "Live 360 τιμή", "κόστος ψηφιακού menu", "MenuOS pricing"],
  },
  about: {
    title: "Σχετικά — MenuOS & Live 360° για την ελληνική αγορά",
    description:
      "Το MenuOS φτιάχτηκε για εστιατόρια και ξενοδοχεία στην Ελλάδα: QR menu, live συντονισμός 360° και απλή διαχείριση χωρίς πολυπλοκότητα.",
    path: "/sxetika",
    breadcrumbLabel: "Σχετικά",
    keywords: ["MenuOS", "ψηφιακό menu Ελλάδα"],
  },
  contact: {
    title: "Επικοινωνία — Υποστήριξη & Enterprise",
    description:
      "Επικοινωνήστε με την ομάδα MenuOS για δοκιμή, τιμολόγηση Enterprise ή υποστήριξη. Τηλ. 210 700 0925, info@qrmenus.info",
    path: "/epikoinonia",
    breadcrumbLabel: "Επικοινωνία",
    keywords: ["MenuOS επικοινωνία", "QR menu support"],
  },
  terms: {
    title: "Όροι χρήσης",
    description: "Όροι χρήσης της πλατφόρμας MenuOS (menuos.gr) για επιχειρήσεις φιλοξενίας.",
    path: "/terms",
    breadcrumbLabel: "Όροι χρήσης",
  },
  privacy: {
    title: "Πολιτική απορρήτου",
    description:
      "Πώς το MenuOS συλλέγει και προστατεύει προσωπικά δεδομένα επιχειρηματιών και επισκεπτών menu.",
    path: "/privacy",
    breadcrumbLabel: "Πολιτική απορρήτου",
  },
} as const satisfies Record<string, SeoPageDef>;

export const SEO_HOME_FAQ = [
  {
    q: "Χρειάζεται app ο πελάτης;",
    a: "Όχι. Σκανάρει το QR code και ανοίγει το menu στο κινητό του.",
  },
  {
    q: "Πόσο γρήγορα μπορώ να είμαι έτοιμος;",
    a: "Με βασικό menu, συνήθως σε λιγότερο από μία ώρα. Η δοκιμή είναι {trialDays}.",
  },
  {
    q: "Ταιριάζει σε ξενοδοχεία;",
    a: "Ναι — pool bar, breakfast, room service, ξεχωριστό menu ανά χώρο ή τραπέζι.",
  },
  {
    q: "Πόσες γλώσσες υποστηρίζονται;",
    a: "Ελληνικά, Αγγλικά, Γερμανικά και Γαλλικά.",
  },
  {
    q: "Τι είναι το MenuOS Live · 360°;",
    a: "Live συντονισμός κλήσεων και παραγγελιών από QR menu — βλέπετε τι συμβαίνει στο κατάστημα σε πραγματικό χρόνο, χωρίς ξεχωριστό σύστημα.",
  },
] as const;

export const SEO_QR_MENU_FAQ = [
  {
    q: "Τι είναι QR menu;",
    a: "Ψηφιακό menu που ανοίγει όταν ο πελάτης σκανάρει QR code με το κινητό. Δεν χρειάζεται εφαρμογή.",
  },
  {
    q: "Ταιριάζει σε ξενοδοχεία;",
    a: "Ναι — pool bar, breakfast, room service, spa. Ξεχωριστό menu ανά χώρο ή τραπέζι.",
  },
  {
    q: "Πόσες γλώσσες υποστηρίζονται;",
    a: "Πολλαπλές γλώσσες στο QR menu — αλλαγή με ένα πάτημα.",
  },
  {
    q: "Μπορώ να αλλάξω τιμές γρήγορα;",
    a: "Ναι. Αλλάζετε από τη διαχείριση και η αλλαγή φαίνεται αμέσως στους πελάτες.",
  },
  {
    q: "Τι είναι το Live 360°;",
    a: "Live panel για κλήσεις σερβιτόρου και παραγγελίες από QR — βλέπετε αναμονές, σταθμούς και ολοκληρώσεις σε πραγματικό χρόνο.",
  },
] as const;

export const SEO_PRICING_OFFERS = [
  { name: "Δοκιμή {trialDaysGen}", price: 0, description: "1 κατάστημα, QR menu, Live 360°, 50 πιάτα" },
  { name: "Basic", price: 9.99, description: "1 κατάστημα, 3 κατάλογοι, Live 360°, απεριόριστα πιάτα" },
  { name: "Pro", price: 19.99, description: "3 καταστήματα, Live 360°, απεριόριστοι κατάλογοι" },
] as const;

export const SEO_PRICING_FAQ = [
  {
    q: "Χρειάζεται πιστωτική κάρτα για τη δοκιμή;",
    a: "Όχι. Η δοκιμή {trialDaysGen} ξεκινά με email και κωδικό επιβεβαίωσης.",
  },
  {
    q: "Μπορώ να αλλάξω πλάνο αργότερα;",
    a: "Ναι. Basic και Pro αναβαθμίζονται από τη σελίδα συνδρομής. Για Enterprise επικοινωνείτε μαζί μας.",
  },
  {
    q: "Τι περιλαμβάνει το Enterprise;",
    a: "Custom domain, white-label, πολλαπλά καταστήματα, προτεραιότητα υποστήριξης — προσφορά ανά project.",
  },
  {
    q: "Υπάρχει δέσμευση;",
    a: "Όχι. Μηνιαία συνδρομή, ακύρωση όποτε θέλετε.",
  },
  {
    q: "Περιλαμβάνεται το Live 360°;",
    a: "Ναι — στη δοκιμή, Basic και Pro. Live panel κλήσεων και συντονισμός χωρίς επιπλέον χρέωση.",
  },
] as const;

export const SEO_SITEMAP_ROUTES = Object.values(SEO_PAGES).map((page) => page.path);
