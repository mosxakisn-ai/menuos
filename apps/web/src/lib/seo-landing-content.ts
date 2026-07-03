import type { SeoCitySlug, SeoLandingConfig, SeoProductSlug, SeoVerticalSlug } from "@/lib/seo-landing";
import { TRIAL_DAYS } from "@menuos/shared";
import { trialDayLabels } from "@/lib/trial-marketing";

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
  naxos: { el: "Νάξος", en: "Naxos", inEl: "στη Νάξο", inEn: "in Naxos" },
  zakynthos: { el: "Ζάκυνθος", en: "Zakynthos", inEl: "στη Ζάκυνθο", inEn: "in Zakynthos" },
  chania: { el: "Χανιά", en: "Chania", inEl: "στα Χανιά", inEn: "in Chania" },
  kos: { el: "Κως", en: "Kos", inEl: "στην Κω", inEn: "on Kos" },
  lefkada: { el: "Λευκάδα", en: "Lefkada", inEl: "στη Λευκάδα", inEn: "in Lefkada" },
  halkidiki: {
    el: "Χαλκιδική",
    en: "Halkidiki",
    inEl: "στη Χαλκιδική",
    inEn: "in Halkidiki",
  },
  ios: { el: "Ίος", en: "Ios", inEl: "στην Ίο", inEn: "in Ios" },
  skiathos: { el: "Σκιάθος", en: "Skiathos", inEl: "στη Σκιάθο", inEn: "in Skiathos" },
  kalamata: { el: "Καλαμάτα", en: "Kalamata", inEl: "στην Καλαμάτα", inEn: "in Kalamata" },
  patra: { el: "Πάτρα", en: "Patras", inEl: "στην Πάτρα", inEn: "in Patras" },
  ioannina: { el: "Ιωάννινα", en: "Ioannina", inEl: "στα Ιωάννινα", inEn: "in Ioannina" },
  kavala: { el: "Καβάλα", en: "Kavala", inEl: "στην Καβάλα", inEn: "in Kavala" },
  milos: { el: "Μήλος", en: "Milos", inEl: "στη Μήλο", inEn: "in Milos" },
  rethymno: { el: "Ρέθυμνο", en: "Rethymno", inEl: "στο Ρέθυμνο", inEn: "in Rethymno" },
  iraklio: { el: "Ηράκλειο", en: "Heraklion", inEl: "στο Ηράκλειο", inEn: "in Heraklion" },
  sifnos: { el: "Σίφνος", en: "Sifnos", inEl: "στη Σίφνο", inEn: "in Sifnos" },
  larisa: { el: "Λάρισα", en: "Larissa", inEl: "στη Λάρισα", inEn: "in Larissa" },
  volos: { el: "Βόλος", en: "Volos", inEl: "στον Βόλο", inEn: "in Volos" },
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

/** Terminology per venue type — not everything is «τραπέζι / δωμάτιο». */
const VERTICAL_SEO: Record<
  SeoVerticalSlug,
  {
    sceneEl: string;
    sceneEn: string;
    qrPlacementEl: string;
    qrPlacementEn: string;
    serviceEl: string;
    serviceEn: string;
    faqPlacementQEl: string;
    faqPlacementQEn: string;
    faqPlacementAEl: string;
    faqPlacementAEn: string;
  }
> = {
  estiatorio: {
    sceneEl: "Οι πελάτες σκανάρουν QR στο τραπέζι τους",
    sceneEn: "Guests scan a QR code at their table",
    qrPlacementEl: "QR codes ανά τραπέζι",
    qrPlacementEn: "QR codes per table",
    serviceEl: "Κλήση σερβιτόρου με αριθμό τραπεζιού",
    serviceEn: "Call waiter with table number",
    faqPlacementQEl: "Πού μπαίνουν τα QR;",
    faqPlacementQEn: "Where do QR codes go?",
    faqPlacementAEl: "Σε κάθε τραπέζι — το link περιλαμβάνει αριθμό τραπεζιού.",
    faqPlacementAEn: "On each table — the link includes the table number.",
  },
  xenodocheio: {
    sceneEl: "QR στο εστιατόριο, bar, pool ή δωμάτιο",
    sceneEn: "QR at the restaurant, bar, pool area or in-room",
    qrPlacementEl: "QR codes ανά τραπέζι, bar ή δωμάτιο",
    qrPlacementEn: "QR codes per table, bar zone or room",
    serviceEl: "Κλήση σερβιτόρου / room service με τραπέζι ή δωμάτιο",
    serviceEn: "Call staff or room service by table or room",
    faqPlacementQEl: "Πού μπαίνουν τα QR;",
    faqPlacementQEn: "Where do QR codes go?",
    faqPlacementAEl: "Ανά χώρο: εστιατόριο (τραπέζι), pool bar, breakfast, δωμάτιο room service.",
    faqPlacementAEn: "Per area: restaurant tables, pool bar, breakfast, in-room for room service.",
  },
  "beach-bar": {
    sceneEl: "Οι επισκέπτες σκανάρουν από την ξαπλώστρα ή το τραπέζι τους",
    sceneEn: "Guests scan from their sunbed or beach table",
    qrPlacementEl: "QR codes ανά ξαπλώστρα ή τραπέζι",
    qrPlacementEn: "QR codes per sunbed or table",
    serviceEl: "Κλήση σερβιτόρου με αριθμό ξαπλώστρας",
    serviceEn: "Call waiter with sunbed number",
    faqPlacementQEl: "Πού μπαίνουν τα QR στο beach bar;",
    faqPlacementQEn: "Where do QR codes go at a beach bar?",
    faqPlacementAEl: "Στην ξαπλώστρα ή στο τραπέζι — όχι «δωμάτιο». Κάθε QR μπορεί να έχει αριθμό ξαπλώστρας.",
    faqPlacementAEn: "On the sunbed or table — not a hotel room. Each QR can carry a sunbed number.",
  },
  "pool-bar": {
    sceneEl: "Οι επισκέπτες σκανάρουν από την ξαπλώστρα pool ή το bar",
    sceneEn: "Guests scan from a pool sunbed or the bar",
    qrPlacementEl: "QR codes ανά ξαπλώστρα pool ή τραπέζι bar",
    qrPlacementEn: "QR codes per pool sunbed or bar table",
    serviceEl: "Κλήση σερβιτόρου με ξαπλώστρα ή τραπέζι",
    serviceEn: "Call waiter by sunbed or table",
    faqPlacementQEl: "Πού μπαίνουν τα QR στο pool bar;",
    faqPlacementQEn: "Where do QR codes go at the pool bar?",
    faqPlacementAEl: "Στις ξαπλώστρες γύρω από το pool ή στα τραπέζια του bar.",
    faqPlacementAEn: "On pool sunbeds or bar tables around the pool.",
  },
  "room-service": {
    sceneEl: "Οι πελάτες παραγγέλνουν από το δωμάτιό τους",
    sceneEn: "Guests order from their hotel room",
    qrPlacementEl: "QR codes ανά δωμάτιο",
    qrPlacementEn: "QR codes per room",
    serviceEl: "Αίτημα room service με αριθμό δωματίου",
    serviceEn: "Room service requests with room number",
    faqPlacementQEl: "Πού μπαίνουν τα QR;",
    faqPlacementQEn: "Where do QR codes go?",
    faqPlacementAEl: "Στο δωμάτιο (card, TV area, folder) — το link φέρει αριθμό δωματίου.",
    faqPlacementAEn: "In the room (card, folder) — the link includes the room number.",
  },
  spa: {
    sceneEl: "Οι επισκέπτες βλέπουν υπηρεσίες και τιμές spa στο κινητό",
    sceneEn: "Guests browse spa services and prices on mobile",
    qrPlacementEl: "QR codes στο reception spa ή ανά χώρο θεραπείας",
    qrPlacementEn: "QR at spa reception or per treatment area",
    serviceEl: "Επικοινωνία με reception spa (χωρίς τραπέζι/ξαπλώστρα)",
    serviceEn: "Contact spa reception (no table or sunbed flow)",
    faqPlacementQEl: "Πού μπαίνουν τα QR στο spa;",
    faqPlacementQEn: "Where do QR codes go in a spa?",
    faqPlacementAEl: "Στο reception, στους χώρους αναμονής ή στα δωμάτια ξενοδοχείου — menu υπηρεσιών, όχι φαγητό τραπεζιού.",
    faqPlacementAEn: "At reception, waiting areas or hotel rooms — a services menu, not a restaurant table flow.",
  },
};

const PRODUCT_LABELS: Record<SeoProductSlug, { el: string; en: string }> = {
  "qr-menu": { el: "QR menu", en: "QR menu" },
  "digital-menu": { el: "ψηφιακό menu", en: "digital menu" },
};

const LIVE_360_BULLET = {
  el: "MenuOS Live · 360° — live συντονισμός κλήσεων",
  en: "MenuOS Live · 360° — live call coordination",
} as const;

const LIVE_360_FAQ = {
  el: {
    q: "Τι είναι το Live 360°;",
    a: "Live panel για κλήσεις σερβιτόρου και παραγγελίες από QR — βλέπετε αναμονές και ολοκληρώσεις σε πραγματικό χρόνο.",
  },
  en: {
    q: "What is Live 360°?",
    a: "Live panel for waiter calls and orders from QR — track waiting and completions in real time.",
  },
} as const;

function getLive360LandingCopy(locale: SeoLandingLocale, trialDays = TRIAL_DAYS): SeoLandingCopy {
  const isEl = locale === "el";
  const trial = trialDayLabels(trialDays, locale);

  return {
    metaTitle: isEl
      ? "MenuOS Live · 360° — live συντονισμός για εστιατόρια & ξενοδοχεία"
      : "MenuOS Live · 360° — live coordination for restaurants & hotels",
    metaDescription: isEl
      ? `Live συντονισμός κλήσεων και παραγγελιών από QR menu. Panel σερβιτόρου, σταθμοί, pass signals — δωρεάν δοκιμή ${trial.trialDaysGen}.`
      : `Live coordination of calls and orders from your QR menu. Waiter panel, stations, pass signals — free ${trial.trialDaysAdj} trial.`,
    breadcrumbLabel: isEl ? "Live 360°" : "Live 360°",
    h1: isEl
      ? "MenuOS Live · 360° — βλέπεις ό,τι συμβαίνει live"
      : "MenuOS Live · 360° — see everything happening live",
    eyebrow: isEl ? "MenuOS · Live 360°" : "MenuOS · Live 360°",
    paragraphs: isEl
      ? [
          "Το MenuOS Live · 360° συνδέει το QR menu με live συντονισμό: κλήσεις σερβιτόρου, παραγγελίες, σταθμοί κουζίνας/bar — όλα σε ένα panel, χωρίς ξεχωριστό σύστημα.",
          "Ιδανικό για εστιατόρια, beach bars και ξενοδοχεία που θέλουν ταχύτητα στην εξυπηρέτηση. Οι πελάτες σκανάρουν QR — εσείς βλέπετε live τι χρειάζεται κάθε τραπέζι, ξαπλώστρα ή δωμάτιο.",
          `Ξεκινήστε με δωρεάν δοκιμή ${trial.trialDaysGen} — Live 360° included σε δοκιμή, Basic και Pro.`,
        ]
      : [
          "MenuOS Live · 360° connects your QR menu with live coordination: waiter calls, orders, kitchen/bar stations — all in one panel, no separate system.",
          "Built for restaurants, beach bars and hotels that need faster service. Guests scan QR — you see live what each table, sunbed or room needs.",
          `Start with a free ${trial.trialDaysAdj} trial — Live 360° included on trial, Basic and Pro.`,
        ],
    bullets: isEl
      ? [
          LIVE_360_BULLET.el,
          "Κλήση σερβιτόρου από QR (τραπέζι/δωμάτιο/ξαπλώστρα)",
          "Panel σερβιτόρου & pass signals",
          "Πολλαπλές γλώσσες QR",
        ]
      : [
          LIVE_360_BULLET.en,
          "Call waiter from QR (table/room/sunbed)",
          "Waiter panel & pass signals",
          "Multiple QR languages",
        ],
    faq: isEl
      ? [
          { q: LIVE_360_FAQ.el.q, a: LIVE_360_FAQ.el.a },
          {
            q: "Χρειάζεται ξεχωριστή εφαρμογή;",
            a: "Όχι. Το panel τρέχει στο browser — PWA με push ειδοποιήσεις για κλήσεις.",
          },
          {
            q: "Περιλαμβάνεται στα πλάνα;",
            a: "Ναι — δοκιμή, Basic και Pro. Χωρίς επιπλέον χρέωση.",
          },
          {
            q: "Ταιριάζει σε ξενοδοχεία;",
            a: "Ναι — room service, pool bar, εστιατόριο. QR ανά χώρο με live tracking.",
          },
        ]
      : [
          { q: LIVE_360_FAQ.en.q, a: LIVE_360_FAQ.en.a },
          {
            q: "Do I need a separate app?",
            a: "No. The panel runs in the browser — PWA with push notifications for calls.",
          },
          {
            q: "Is it included in plans?",
            a: "Yes — trial, Basic and Pro. No extra charge.",
          },
          {
            q: "Does it work for hotels?",
            a: "Yes — room service, pool bar, restaurant. QR per area with live tracking.",
          },
        ],
    ctaTitle: isEl ? "Δοκίμασε Live 360° δωρεάν" : "Try Live 360° free",
    ctaDescription: isEl
      ? `${trial.trialDays} δοκιμή. QR menu + live panel — χωρίς κάρτα.`
      : `${trial.trialDaysAdj} trial. QR menu + live panel — no credit card.`,
    keywords: isEl
      ? ["Live 360", "live συντονισμός εστιατορίου", "panel σερβιτόρου", "QR menu"]
      : ["Live 360", "restaurant live coordination", "waiter panel", "QR menu"],
  };
}

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

export function getSeoLandingCopy(
  config: SeoLandingConfig,
  locale: SeoLandingLocale,
  trialDays = TRIAL_DAYS,
): SeoLandingCopy {
  if (config.path === "/live-360") {
    return getLive360LandingCopy(locale, trialDays);
  }

  const product = productLabel(config.product, locale);
  const subject = buildSubject(config, locale);
  const context = buildContextPhrase(config, locale);
  const isEl = locale === "el";
  const trial = trialDayLabels(trialDays, locale);

  const metaTitle =
    config.kind === "product"
      ? isEl
        ? "Ψηφιακό menu online — digital menu για εστιατόρια & ξενοδοχεία"
        : "Digital menu online — for restaurants & hotels"
      : isEl
        ? `${subject} | MenuOS`
        : `${subject} | MenuOS`;

  const metaDescription = isEl
    ? `Φτιάξτε ${product} με Live 360° για ${context}. Πολυγλωσσικό menu, live κλήσεις, QR codes — δωρεάν δοκιμή ${trial.trialDaysGen}.`
    : `Create a ${product} with Live 360° for ${context}. Multilingual menu, live calls, QR codes — free ${trial.trialDaysAdj} trial.`;

  const h1 =
    config.kind === "product"
      ? isEl
        ? "Ψηφιακό menu για εστιατόρια, ξενοδοχεία & bars"
        : "Digital menu for restaurants, hotels & bars"
      : isEl
        ? `${product} για ${context}`
        : `${product} for ${context}`;

  const verticalSeo = config.vertical ? VERTICAL_SEO[config.vertical] : null;

  const paragraphs = isEl
    ? [
        verticalSeo
          ? `${verticalSeo.sceneEl}. Το MenuOS συνδυάζει ${product} με Live 360° — φωτογραφίες, τιμές, live κλήσεις και πολλαπλές γλώσσες. Εσείς ενημερώνετε από τη διαχείριση σε λεπτά.`
          : `Το MenuOS συνδυάζει ${product} με Live 360°: οι πελάτες σκανάρουν QR, βλέπουν φωτογραφίες και τιμές — εσείς ενημερώνετε και βλέπετε κλήσεις live.`,
        config.city
          ? `Ιδανικό για επιχειρήσεις ${context}: τουρίστες, εποχικότητα, γρήγορες αλλαγές τιμών χωρίς επανεκτύπωση.`
          : verticalSeo
            ? `Ιδανικό για ${context} — premium εμφάνιση, πολλαπλές γλώσσες QR, ${verticalSeo.qrPlacementEl.toLowerCase()}.`
            : `Ιδανικό για ${context} που θέλουν premium εμφάνιση, πολλαπλές γλώσσες QR και απλή διαχείριση χωρίς τεχνικές γνώσεις.`,
        `Ξεκινήστε με δωρεάν δοκιμή ${trial.trialDaysGen} — χωρίς κάρτα. Κατεβάζετε QR codes και είστε live την ίδια μέρα.`,
      ]
    : [
        verticalSeo
          ? `${verticalSeo.sceneEn}. MenuOS combines ${product} with Live 360° — photos, prices, live calls and multiple languages. You update from your panel in minutes.`
          : `MenuOS combines ${product} with Live 360°: guests scan QR, browse photos and prices — you update and track calls live.`,
        config.city
          ? `Built for businesses ${context}: tourists, seasonal menus, and instant price updates without reprinting.`
          : verticalSeo
            ? `Built for ${context} — premium look, multiple QR languages, ${verticalSeo.qrPlacementEn.toLowerCase()}.`
            : `Built for ${context} that want a premium look, multiple QR languages, and simple management without technical skills.`,
        `Start with a free ${trial.trialDaysAdj} trial — no credit card. Download QR codes and go live the same day.`,
      ];

  const bullets = isEl
    ? [
        "Πολλαπλές γλώσσες QR",
        LIVE_360_BULLET.el,
        verticalSeo?.serviceEl ?? "Κλήση σερβιτόρου από το menu",
        verticalSeo?.qrPlacementEl ??
          (config.city
            ? "QR codes ανά τραπέζι, ξαπλώστρα, bar ή δωμάτιο"
            : "QR codes ανά τραπέζι, bar ή χώρο"),
        "Ενημέρωση τιμών σε δευτερόλεπτα",
      ]
    : [
        "Multiple QR languages",
        LIVE_360_BULLET.en,
        verticalSeo?.serviceEn ?? "Call waiter from the menu",
        verticalSeo?.qrPlacementEn ??
          (config.city
            ? "QR codes per table, sunbed, bar or room"
            : "QR codes per table, bar or area"),
        "Update prices in seconds",
      ];

  const faq: FaqItem[] = isEl
    ? [
        {
          q: "Χρειάζεται app ο πελάτης;",
          a: "Όχι. Σκανάρει το QR και ανοίγει το menu στο κινητό — χωρίς κατέβασμα.",
        },
        ...(verticalSeo
          ? [
              {
                q: verticalSeo.faqPlacementQEl,
                a: verticalSeo.faqPlacementAEl,
              },
            ]
          : []),
        {
          q: "Πόσο γρήγορα μπορώ να είμαι live;",
          a: "Με βασικό κατάλογο, συνήθως σε λιγότερο από μία ώρα.",
        },
        {
          q: "Ταιριάζει για τουρίστες;",
          a: "Ναι — πολλαπλές γλώσσες QR με ένα πάτημα στο κινητό.",
        },
        {
          q: LIVE_360_FAQ.el.q,
          a: LIVE_360_FAQ.el.a,
        },
        {
          q: "Υπάρχει δοκιμή;",
          a: `Ναι, ${trial.trialDays} δωρεάν χωρίς κάρτα.`,
        },
      ]
    : [
        {
          q: "Does the guest need an app?",
          a: "No. They scan the QR and the menu opens in the browser — no download.",
        },
        ...(verticalSeo
          ? [
              {
                q: verticalSeo.faqPlacementQEn,
                a: verticalSeo.faqPlacementAEn,
              },
            ]
          : []),
        {
          q: "How fast can I go live?",
          a: "With a basic menu, usually in under an hour.",
        },
        {
          q: "Is it good for tourists?",
          a: "Yes — multiple QR languages with one tap on mobile.",
        },
        {
          q: LIVE_360_FAQ.en.q,
          a: LIVE_360_FAQ.en.a,
        },
        {
          q: "Is there a trial?",
          a: `Yes — ${trial.trialDays} free, no credit card.`,
        },
      ];

  const keywords: string[] = [];
  if (config.product === "qr-menu") keywords.push("QR menu", "menu QR code");
  else keywords.push("ψηφιακό menu", "digital menu");
  keywords.push("Live 360");
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
      ? `${trial.trialDays} δοκιμή. Χωρίς κάρτα. Φτιάξε κατάλογο και δοκίμασε το QR.`
      : `${trial.trialDaysAdj} trial. No credit card. Build your menu and test the QR.`,
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
