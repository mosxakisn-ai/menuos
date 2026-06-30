/** Κεντρικό SEO copy — ελληνική αγορά, απλή γλώσσα, χωρίς jargon. */
export const SEO_SITE = {
  name: "MenuOS",
  locale: "el_GR",
  language: "el-GR",
  region: "GR",
  contactEmail: "info@b-os.gr",
  contactPhone: "210 700 0925",
  contactPhoneTel: "+302107000925",
  contactFacebook: "https://www.facebook.com/MenuOs.Greece/",
  url: "https://menuos.gr",

  defaultTitle: "MenuOS — Ψηφιακό menu με QR για εστιατόρια & ξενοδοχεία",
  titleTemplate: "%s | MenuOS",
  description:
    "Ψηφιακό menu με QR για εστιατόρια, ξενοδοχεία και bars στην Ελλάδα. Οι πελάτες σκανάρουν, βλέπουν τιμές και ενημερωμένο κατάλογο — εσείς το αλλάζετε online σε λεπτά.",

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
    title: "Ψηφιακό menu με QR — εστιατόρια, ξενοδοχεία & bars",
    description:
      "Φτιάξτε ψηφιακό menu με QR σε λεπτά. Πολυγλωσσικό, εύκολη ενημέρωση τιμών, χωρίς app για τον πελάτη. Δωρεάν δοκιμή 7 ημερών για επιχειρήσεις φιλοξενίας.",
    path: "/",
    breadcrumbLabel: "Αρχική",
    keywords: [
      "ψηφιακό menu εστιατόριο",
      "QR menu ξενοδοχείο",
      "menu QR code Ελλάδα",
      "digital menu hospitality",
    ],
  },
  qrMenu: {
    title: "QR Menu για εστιατόρια & ξενοδοχεία",
    description:
      "Δημιουργήστε QR menu για εστιατόριο ή ξενοδοχείο. Οι πελάτες σκανάρουν από το κινητό, βλέπουν φωτογραφίες και τιμές — εσείς ενημερώνετε το menu online.",
    path: "/qr-menu",
    breadcrumbLabel: "QR Menu",
    keywords: ["QR menu", "QR menu εστιατόριο", "QR menu ξενοδοχείο", "ψηφιακό menu QR"],
  },
  services: {
    title: "Υπηρεσίες — Ψηφιακό menu & QR codes",
    description:
      "Υπηρεσίες MenuOS: ψηφιακό menu, QR codes, πολλαπλές γλώσσες, κλήση σερβιτόρου, online panel για εστιατόρια και ξενοδοχεία.",
    path: "/ypiresies",
    breadcrumbLabel: "Υπηρεσίες",
    keywords: ["υπηρεσίες QR menu", "ψηφιακό menu SaaS", "menu platform εστιατόριο"],
  },
  howItWorks: {
    title: "Πώς λειτουργεί — από εγγραφή σε έτοιμο menu",
    description:
      "Πώς ξεκινάτε με MenuOS: εγγραφή, φτιάξιμο menu, QR στα τραπέζια. Απλά βήματα για εστιατόρια και ξενοδοχεία.",
    path: "/pos-leitourgei",
    breadcrumbLabel: "Πώς λειτουργεί",
    keywords: ["πώς φτιάχνω QR menu", "QR menu βήματα", "ψηφιακό menu οδηγός"],
  },
  pricing: {
    title: "Τιμές — Πλάνα από €9.99/μήνα",
    description:
      "Τιμές MenuOS: δωρεάν δοκιμή 7 ημερών, Basic €9.99/μήνα, Pro €19.99/μήνα. Χωρίς κρυφές χρεώσεις. Για Enterprise επικοινωνήστε μαζί μας.",
    path: "/pricing",
    breadcrumbLabel: "Τιμές",
    keywords: ["τιμές QR menu", "κόστος ψηφιακού menu", "MenuOS pricing"],
  },
  about: {
    title: "Σχετικά — MenuOS για την ελληνική αγορά",
    description:
      "Το MenuOS φτιάχτηκε για εστιατόρια και ξενοδοχεία στην Ελλάδα που θέλουν σύγχρονο ψηφιακό menu χωρίς πολυπλοκότητα.",
    path: "/sxetika",
    breadcrumbLabel: "Σχετικά",
    keywords: ["MenuOS", "ψηφιακό menu Ελλάδα"],
  },
  contact: {
    title: "Επικοινωνία — Υποστήριξη & Enterprise",
    description:
      "Επικοινωνήστε με την ομάδα MenuOS για δοκιμή, τιμολόγηση Enterprise ή υποστήριξη. Τηλ. 210 700 0925, info@b-os.gr",
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
    a: "Όχι. Σκανάρει το QR code και ανοίγει το menu στο browser του κινητού.",
  },
  {
    q: "Πόσο γρήγορα μπορώ να είμαι live;",
    a: "Με βασικό menu, συνήθως σε λιγότερο από μία ώρα. Η δοκιμή είναι 7 ημέρες.",
  },
  {
    q: "Ταιριάζει σε ξενοδοχεία;",
    a: "Ναι — pool bar, breakfast, room service, ξεχωριστό menu ανά χώρο ή τραπέζι.",
  },
  {
    q: "Πόσες γλώσσες υποστηρίζονται;",
    a: "Ελληνικά, Αγγλικά, Γερμανικά και Γαλλικά.",
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
    a: "Ναι. Αλλάζετε από το panel σας και η αλλαγή φαίνεται αμέσως στους πελάτες.",
  },
] as const;

export const SEO_PRICING_OFFERS = [
  { name: "Δοκιμή 7 ημερών", price: 0, description: "1 κατάστημα, 1 κατάλογος, 50 πιάτα" },
  { name: "Basic", price: 9.99, description: "1 κατάστημα, 3 κατάλογοι, απεριόριστα πιάτα" },
  { name: "Pro", price: 19.99, description: "3 καταστήματα, απεριόριστοι κατάλογοι" },
] as const;

export const SEO_PRICING_FAQ = [
  {
    q: "Χρειάζεται πιστωτική κάρτα για τη δοκιμή;",
    a: "Όχι. Η δοκιμή 7 ημερών ξεκινά με email και OTP επιβεβαίωση.",
  },
  {
    q: "Μπορώ να αλλάξω πλάνο αργότερα;",
    a: "Ναι. Basic και Pro αναβαθμίζονται από το panel τιμολόγησης. Για Enterprise επικοινωνείτε μαζί μας.",
  },
  {
    q: "Τι περιλαμβάνει το Enterprise;",
    a: "Custom domain, white-label, πολλαπλά καταστήματα, προτεραιότητα υποστήριξης — προσφορά ανά project.",
  },
  {
    q: "Υπάρχει δέσμευση;",
    a: "Όχι. Μηνιαία συνδρομή, ακύρωση όποτε θέλετε.",
  },
] as const;

export const SEO_SITEMAP_ROUTES = Object.values(SEO_PAGES).map((page) => page.path);

export const SEO_LLMS = `# MenuOS (menuos.gr)

> Ψηφιακό menu με QR για εστιατόρια, ξενοδοχεία και bars στην Ελλάδα.

## Τι κάνουμε
- Online πλατφόρμα για ψηφιακό menu με QR codes
- Πολυγλωσσικό QR menu (Ελληνικά, English, Deutsch, Français)
- Online panel για ενημέρωση τιμών και πιάτων
- Δωρεάν δοκιμή 7 ημερών
- Τιμές: Basic €9.99/μήνα, Pro €19.99/μήνα

## Κύριες σελίδες
- ${SEO_SITE.url}/
- ${SEO_SITE.url}/qr-menu
- ${SEO_SITE.url}/digital-menu
- ${SEO_SITE.url}/estiatorio/qr-menu
- ${SEO_SITE.url}/xenodocheio/digital-menu
- ${SEO_SITE.url}/rodos/qr-menu
- ${SEO_SITE.url}/santorini/digital-menu
- ${SEO_SITE.url}/athina/qr-menu
- ${SEO_SITE.url}/ypiresies
- ${SEO_SITE.url}/pos-leitourgei
- ${SEO_SITE.url}/pricing
- ${SEO_SITE.url}/sxetika
- ${SEO_SITE.url}/epikoinonia
- ${SEO_SITE.url}/blog
- ${SEO_SITE.url}/blog/pws-ftiaxno-qr-menu
- ${SEO_SITE.url}/privacy

## SEO
- Sitemap: ${SEO_SITE.url}/sitemap.xml
- English UI: append ?lang=en to any marketing URL

## Επικοινωνία
- Τηλέφωνο: ${SEO_SITE.contactPhone}
- Email: ${SEO_SITE.contactEmail}
- Facebook: ${SEO_SITE.contactFacebook}
`;
