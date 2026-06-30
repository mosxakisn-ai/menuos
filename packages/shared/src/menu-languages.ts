/** Γλώσσες στο public QR menu — ίδιες με τη βάση (GR, EN, DE, FR). */
export const QR_MENU_LANGUAGES = ["GR", "EN", "DE", "FR"] as const;
export type QrMenuLanguage = (typeof QR_MENU_LANGUAGES)[number];

export const QR_MENU_LANGUAGE_LABELS: Record<
  QrMenuLanguage,
  { short: string; name: string; ariaLabel: string }
> = {
  GR: { short: "ΕΛ", name: "Ελληνικά", ariaLabel: "Ελληνικά" },
  EN: { short: "EN", name: "English", ariaLabel: "English" },
  DE: { short: "DE", name: "Deutsch", ariaLabel: "Deutsch" },
  FR: { short: "FR", name: "Français", ariaLabel: "Français" },
};

const LANG_ALIASES: Record<string, QrMenuLanguage> = {
  gr: "GR",
  el: "GR",
  greek: "GR",
  en: "EN",
  english: "EN",
  eng: "EN",
  de: "DE",
  deutsch: "DE",
  german: "DE",
  ger: "DE",
  fr: "FR",
  french: "FR",
  francais: "FR",
};

export function parseQrMenuLanguage(raw?: string | null): QrMenuLanguage {
  const v = raw?.trim().toLowerCase();
  if (v && LANG_ALIASES[v]) return LANG_ALIASES[v];
  return "GR";
}

export function isQrMenuLanguage(code: string): code is QrMenuLanguage {
  return (QR_MENU_LANGUAGES as readonly string[]).includes(code);
}

export const QR_MENU_UI = {
  GR: {
    table: (n: string) => `Τραπέζι ${n}`,
    room: (n: string) => `Δωμάτιο ${n}`,
    callWaiter: "Κλήση σερβιτόρου",
    requestBill: "Λογαριασμός",
    cancelCall: "Ακύρωση",
    calling: "Αποστολή...",
    called: "Ο σερβιτόρος ειδοποιήθηκε ✓",
    billSent: "Ζητήθηκε λογαριασμός ✓",
    cancelling: "Ακύρωση...",
    cancelled: "Η κλήση ακυρώθηκε",
    callFailed: "Αποτυχία. Δοκίμασε ξανά.",
    cancelFailed: "Δεν βρέθηκε ενεργή κλήση.",
    rateLimited: "Πολλές κλήσεις. Περίμενε λίγο.",
    menuSoon: "Το menu ενημερώνεται σύντομα.",
    ingredients: "Συστατικά",
    allergens: "Αλλεργιογόνα",
    close: "Κλείσιμο",
    language: "Γλώσσα",
  },
  EN: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Room ${n}`,
    callWaiter: "Call waiter",
    requestBill: "Bill",
    cancelCall: "Cancel",
    calling: "Calling...",
    called: "Waiter notified ✓",
    billSent: "Bill requested ✓",
    cancelling: "Cancelling...",
    cancelled: "Request cancelled",
    callFailed: "Failed. Please try again.",
    cancelFailed: "No active request found.",
    rateLimited: "Too many calls. Please wait.",
    menuSoon: "Menu coming soon.",
    ingredients: "Ingredients",
    allergens: "Allergens",
    close: "Close",
    language: "Language",
  },
  DE: {
    table: (n: string) => `Tisch ${n}`,
    room: (n: string) => `Zimmer ${n}`,
    callWaiter: "Kellner rufen",
    requestBill: "Rechnung",
    cancelCall: "Abbrechen",
    calling: "Senden...",
    called: "Kellner benachrichtigt ✓",
    billSent: "Rechnung angefordert ✓",
    cancelling: "Abbrechen...",
    cancelled: "Anfrage abgebrochen",
    callFailed: "Fehlgeschlagen. Bitte erneut versuchen.",
    cancelFailed: "Keine aktive Anfrage.",
    rateLimited: "Zu viele Anfragen. Bitte warten.",
    menuSoon: "Speisekarte wird aktualisiert.",
    ingredients: "Zutaten",
    allergens: "Allergene",
    close: "Schließen",
    language: "Sprache",
  },
  FR: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Chambre ${n}`,
    callWaiter: "Appeler le serveur",
    requestBill: "Addition",
    cancelCall: "Annuler",
    calling: "Envoi...",
    called: "Serveur prévenu ✓",
    billSent: "Addition demandée ✓",
    cancelling: "Annulation...",
    cancelled: "Demande annulée",
    callFailed: "Échec. Réessayez.",
    cancelFailed: "Aucune demande active.",
    rateLimited: "Trop de demandes. Patientez.",
    menuSoon: "Carte bientôt disponible.",
    ingredients: "Ingrédients",
    allergens: "Allergènes",
    close: "Fermer",
    language: "Langue",
  },
} as const;

export type QrMenuUiStrings = (typeof QR_MENU_UI)[QrMenuLanguage];

const QR_MENU_FALLBACK_ORDER: QrMenuLanguage[] = ["GR", "EN", "DE", "FR"];

/** Επιλογή μετάφρασης πιάτου/κατηγορίας με fallback GR → EN → DE → FR. */
export function pickQrMenuTranslation<T extends { language: string }>(
  translations: T[],
  lang: QrMenuLanguage,
): T | undefined {
  const direct = translations.find((t) => t.language === lang);
  if (direct) return direct;

  for (const code of QR_MENU_FALLBACK_ORDER) {
    const hit = translations.find((t) => t.language === code);
    if (hit) return hit;
  }

  return translations[0];
}

/** Δημιουργία μεταφράσεων κατηγορίας/πιάτου από φόρμα dashboard. */
export function buildMenuNameTranslations(input: {
  nameGr: string;
  nameEn?: string | null;
  nameDe?: string | null;
  nameFr?: string | null;
}): Array<{ language: QrMenuLanguage; name: string }> {
  const rows: Array<{ language: QrMenuLanguage; name: string }> = [
    { language: "GR", name: input.nameGr.trim() },
  ];
  if (input.nameEn?.trim()) rows.push({ language: "EN", name: input.nameEn.trim() });
  if (input.nameDe?.trim()) rows.push({ language: "DE", name: input.nameDe.trim() });
  if (input.nameFr?.trim()) rows.push({ language: "FR", name: input.nameFr.trim() });
  return rows;
}
