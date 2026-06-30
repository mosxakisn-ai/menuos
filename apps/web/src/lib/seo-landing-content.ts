import type { SeoCitySlug, SeoLandingConfig, SeoProductSlug, SeoVerticalSlug } from "@/lib/seo-landing";

export type SeoLandingLocale = "el" | "en";

type FaqItem = { q: string; a: string };

const CITY_LABELS: Record<SeoCitySlug, { el: string; en: string; inEl: string; inEn: string }> = {
  rodos: { el: "Ρόδος", en: "Rhodes", inEl: "στη Ρόδο", inEn: "in Rhodes" },
  santorini: { el: "Σαντορίνη", en: "Santorini", inEl: "στη Σαντορίνη", inEn: "in Santorini" },
  athina: { el: "Αθήνα", en: "Athens", inEl: "στην Αθήνα", inEn: "in Athens" },
  thessaloniki: {
    el: "Θεσσαλονίκη",
    en: "Thessaloniki",
    inEl: "στη Θεσσαλονίκη",
    inEn: "in Thessaloniki",
  },
  korfu: { el: "Κέρκυρα", en: "Corfu", inEl: "στην Κέρκυρα", inEn: "in Corfu" },
  kriti: { el: "Κρήτη", en: "Crete", inEl: "στην Κρήτη", inEn: "in Crete" },
  mykonos: { el: "Μύκονος", en: "Mykonos", inEl: "στη Μύκονο", inEn: "in Mykonos" },
  paros: { el: "Πάρος", en: "Paros", inEl: "στην Πάρο", inEn: "in Paros" },
};

const VERTICAL_LABELS: Record<
  SeoVerticalSlug,
  { el: string; en: string; forEl: string; forEn: string }
> = {
  estiatorio: { el: "Εστιατόριο", en: "Restaurant", forEl: "εστιατόριο", forEn: "restaurant" },
  xenodocheio: { el: "Ξενοδοχείο", en: "Hotel", forEl: "ξενοδοχείο", forEn: "hotel" },
  "beach-bar": { el: "Beach bar", en: "Beach bar", forEl: "beach bar", forEn: "beach bar" },
  "pool-bar": { el: "Pool bar", en: "Pool bar", forEl: "pool bar", forEn: "pool bar" },
  "room-service": {
    el: "Room service",
    en: "Room service",
    forEl: "room service",
    forEn: "room service",
  },
  spa: { el: "Spa", en: "Spa", forEl: "spa", forEn: "spa" },
};

const PRODUCT_LABELS: Record<SeoProductSlug, { el: string; en: string }> = {
  "qr-menu": { el: "QR menu", en: "QR menu" },
  "digital-menu": { el: "ψηφιακό menu", en: "digital menu" },
};

export type SeoLandingCopy = {
  metaTitle: string;
  metaDescription: string;
  breadcrumbLabel: string;
  h1: string;
  eyebrow: string;
  paragraphs: string[];
  bullets: string[];
  faq: FaqItem[];
  ctaTitle: string;
  ctaDescription: string;
  keywords: string[];
};

function productLabel(product: SeoProductSlug, locale: SeoLandingLocale): string {
  return PRODUCT_LABELS[product][locale];
}

function buildSubject(config: SeoLandingConfig, locale: SeoLandingLocale): string {
  const product = productLabel(config.product, locale);
  const parts: string[] = [];

  if (config.city) {
    parts.push(CITY_LABELS[config.city][locale]);
  }
  if (config.vertical) {
    parts.push(VERTICAL_LABELS[config.vertical][locale]);
  }

  if (parts.length === 0) return product;
  if (locale === "el") return `${product} — ${parts.join(" · ")}`;
  return `${product} — ${parts.join(" · ")}`;
}

function buildContextPhrase(config: SeoLandingConfig, locale: SeoLandingLocale): string {
  if (config.city && config.vertical) {
    const city = CITY_LABELS[config.city];
    const vertical = VERTICAL_LABELS[config.vertical];
    return locale === "el"
      ? `${vertical.forEl} ${city.inEl}`
      : `${vertical.forEn} ${city.inEn}`;
  }
  if (config.city) {
    return locale === "el" ? CITY_LABELS[config.city].inEl : CITY_LABELS[config.city].inEn;
  }
  if (config.vertical) {
    return locale === "el"
      ? VERTICAL_LABELS[config.vertical].forEl
      : VERTICAL_LABELS[config.vertical].forEn;
  }
  return locale === "el" ? "επιχειρήσεις φιλοξενίας" : "hospitality businesses";
}

export function getSeoLandingCopy(config: SeoLandingConfig, locale: SeoLandingLocale): SeoLandingCopy {
  const product = productLabel(config.product, locale);
  const subject = buildSubject(config, locale);
  const context = buildContextPhrase(config, locale);
  const isEl = locale === "el";

  const metaTitle =
    config.kind === "product"
      ? isEl
        ? "Ψηφιακό menu online — digital menu για εστιατόρια & ξενοδοχεία"
        : "Digital menu online — for restaurants & hotels"
      : isEl
        ? `${subject} | MenuOS`
        : `${subject} | MenuOS`;

  const metaDescription = isEl
    ? `Φτιάξτε ${product} για ${context}. Πολυγλωσσικό menu, ενημέρωση τιμών online, QR codes — δωρεάν δοκιμή 7 ημερών.`
    : `Create a ${product} for ${context}. Multilingual menu, online price updates, QR codes — free 7-day trial.`;

  const h1 =
    config.kind === "product"
      ? isEl
        ? "Ψηφιακό menu για εστιατόρια, ξενοδοχεία & bars"
        : "Digital menu for restaurants, hotels & bars"
      : isEl
        ? `${product} για ${context}`
        : `${product} for ${context}`;

  const paragraphs = isEl
    ? [
        `Το MenuOS σας βοηθά να αντικαταστήσετε το printed menu με ένα σύγχρονο ${product}. Οι πελάτες σκανάρουν QR, βλέπουν φωτογραφίες και τιμές — εσείς ενημερώνετε από το panel σας σε λεπτά.`,
        config.city
          ? `Ιδανικό για επιχειρήσεις ${context}: τουρίστες, εποχικότητα, γρήγορες αλλαγές τιμών χωρίς επανεκτύπωση.`
          : `Ιδανικό για ${context} που θέλουν premium εμφάνιση, πολλαπλές γλώσσες QR και απλή διαχείριση χωρίς τεχνικές γνώσεις.`,
        "Ξεκινήστε με δωρεάν δοκιμή 7 ημερών — χωρίς κάρτα. Κατεβάζετε QR codes και είστε live την ίδια μέρα.",
      ]
    : [
        `MenuOS helps you replace printed menus with a modern ${product}. Guests scan a QR code, browse photos and prices — you update everything from your panel in minutes.`,
        config.city
          ? `Built for businesses ${context}: tourists, seasonal menus, and instant price updates without reprinting.`
          : `Built for ${context} that want a premium look, multiple QR languages, and simple management without technical skills.`,
        "Start with a free 7-day trial — no credit card. Download QR codes and go live the same day.",
      ];

  const bullets = isEl
    ? [
        "Πολλαπλές γλώσσες QR",
        "Κλήση σερβιτόρου από το menu",
        "QR codes ανά τραπέζι ή δωμάτιο",
        "Ενημέρωση τιμών σε δευτερόλεπτα",
      ]
    : [
        "Multiple QR languages",
        "Call waiter from the menu",
        "QR codes per table or room",
        "Update prices in seconds",
      ];

  const faq: FaqItem[] = isEl
    ? [
        {
          q: "Χρειάζεται app ο πελάτης;",
          a: "Όχι. Σκανάρει το QR και ανοίγει το menu στο browser.",
        },
        {
          q: "Πόσο γρήγορα μπορώ να είμαι live;",
          a: "Με βασικό κατάλογο, συνήθως σε λιγότερο από μία ώρα.",
        },
        {
          q: "Ταιριάζει για τουρίστες;",
          a: "Ναι — πολλαπλές γλώσσες QR με ένα πάτημα στο κινητό.",
        },
        {
          q: "Υπάρχει δοκιμή;",
          a: "Ναι, 7 ημέρες δωρεάν χωρίς κάρτα.",
        },
      ]
    : [
        {
          q: "Does the guest need an app?",
          a: "No. They scan the QR and the menu opens in the browser.",
        },
        {
          q: "How fast can I go live?",
          a: "With a basic menu, usually in under an hour.",
        },
        {
          q: "Is it good for tourists?",
          a: "Yes — multiple QR languages with one tap on mobile.",
        },
        {
          q: "Is there a trial?",
          a: "Yes — 7 days free, no credit card.",
        },
      ];

  const keywords: string[] = [];
  if (config.product === "qr-menu") keywords.push("QR menu", "menu QR code");
  else keywords.push("ψηφιακό menu", "digital menu");
  if (config.city) keywords.push(`${product} ${CITY_LABELS[config.city][locale]}`);
  if (config.vertical) keywords.push(`${product} ${VERTICAL_LABELS[config.vertical][locale]}`);

  return {
    metaTitle,
    metaDescription,
    breadcrumbLabel: subject,
    h1,
    eyebrow: isEl ? "MenuOS · SEO" : "MenuOS · Guides",
    paragraphs,
    bullets,
    faq,
    ctaTitle: isEl ? "Ξεκίνα δωρεάν σήμερα" : "Start free today",
    ctaDescription: isEl
      ? "7 ημέρες δοκιμή. Χωρίς κάρτα. Φτιάξε κατάλογο και δοκίμασε το QR."
      : "7-day trial. No credit card. Build your menu and test the QR.",
    keywords,
  };
}

export function getSeoLandingBreadcrumbs(
  config: SeoLandingConfig,
  copy: SeoLandingCopy,
  locale: SeoLandingLocale,
) {
  const home = locale === "en" ? "Home" : "Αρχική";
  return [
    { name: home, path: "/" },
    { name: copy.breadcrumbLabel, path: config.path },
  ];
}
