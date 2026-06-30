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
    callWaiterShort: "Σερβιτόρος",
    requestBill: "Λογαριασμός",
    cancelCall: "Ακύρωση",
    calling: "Αποστολή...",
    called: "Ο σερβιτόρος ειδοποιήθηκε ✓",
    calledShort: "Εστάλη!",
    billSent: "Ζητήθηκε λογαριασμός ✓",
    cancelling: "Ακύρωση...",
    cancelled: "Η κλήση ακυρώθηκε",
    callFailed: "Αποτυχία. Δοκίμασε ξανά.",
    cancelFailed: "Δεν βρέθηκε ενεργή κλήση.",
    rateLimited: "Πολλές κλήσεις. Περίμενε λίγο.",
    menuSoon: "Το menu ενημερώνεται σύντομα.",
    menuUnavailableTitle: "Menu",
    menuUnavailable:
      "Το ψηφιακό menu δεν είναι διαθέσιμο αυτή τη στιγμή. Επικοινώνησε με το κατάστημα για φυσικό menu ή περίμενε να ενεργοποιηθεί ξανά η υπηρεσία.",
    ingredients: "Συστατικά",
    allergens: "Αλλεργιογόνα",
    close: "Κλείσιμο",
    language: "Γλώσσα",
    poweredBy: "Powered by",
    back: "Πίσω",
    backToMenu: "Πίσω στο menu",
    menuTop: "Πάνω",
    heroWelcome: "Καλώς ήρθατε",
    heroHint: "Επιλέξτε πιάτο για λεπτομέρειες, συστατικά και allergens.",
    footerDigitalMenu: "Ψηφιακό menu",
    footerHome: "Αρχή menu",
  },
  EN: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Room ${n}`,
    callWaiter: "Call waiter",
    callWaiterShort: "Waiter",
    requestBill: "Bill",
    cancelCall: "Cancel",
    calling: "Calling...",
    called: "Waiter notified ✓",
    calledShort: "Sent!",
    billSent: "Bill requested ✓",
    cancelling: "Cancelling...",
    cancelled: "Request cancelled",
    callFailed: "Failed. Please try again.",
    cancelFailed: "No active request found.",
    rateLimited: "Too many calls. Please wait.",
    menuSoon: "Menu coming soon.",
    menuUnavailableTitle: "Menu",
    menuUnavailable:
      "The digital menu is unavailable right now. Please ask staff for a printed menu or try again later.",
    ingredients: "Ingredients",
    allergens: "Allergens",
    close: "Close",
    language: "Language",
    poweredBy: "Powered by",
    back: "Back",
    backToMenu: "Back to menu",
    menuTop: "Top",
    heroWelcome: "Welcome",
    heroHint: "Tap a dish for details, ingredients and allergens.",
    footerDigitalMenu: "Digital menu",
    footerHome: "Menu home",
  },
  DE: {
    table: (n: string) => `Tisch ${n}`,
    room: (n: string) => `Zimmer ${n}`,
    callWaiter: "Kellner rufen",
    callWaiterShort: "Kellner",
    requestBill: "Rechnung",
    cancelCall: "Abbrechen",
    calling: "Senden...",
    called: "Kellner benachrichtigt ✓",
    calledShort: "Gesendet!",
    billSent: "Rechnung angefordert ✓",
    cancelling: "Abbrechen...",
    cancelled: "Anfrage abgebrochen",
    callFailed: "Fehlgeschlagen. Bitte erneut versuchen.",
    cancelFailed: "Keine aktive Anfrage.",
    rateLimited: "Zu viele Anfragen. Bitte warten.",
    menuSoon: "Speisekarte wird aktualisiert.",
    menuUnavailableTitle: "Speisekarte",
    menuUnavailable:
      "Die digitale Speisekarte ist derzeit nicht verfügbar. Bitte fragen Sie das Personal oder versuchen Sie es später erneut.",
    ingredients: "Zutaten",
    allergens: "Allergene",
    close: "Schließen",
    language: "Sprache",
    poweredBy: "Powered by",
    back: "Zurück",
    backToMenu: "Zur Speisekarte",
    menuTop: "Nach oben",
    heroWelcome: "Willkommen",
    heroHint: "Tippen Sie auf ein Gericht für Details, Zutaten und Allergene.",
    footerDigitalMenu: "Digitale Speisekarte",
    footerHome: "Speisekarten-Start",
  },
  FR: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Chambre ${n}`,
    callWaiter: "Appeler le serveur",
    callWaiterShort: "Serveur",
    requestBill: "Addition",
    cancelCall: "Annuler",
    calling: "Envoi...",
    called: "Serveur prévenu ✓",
    calledShort: "Envoyé!",
    billSent: "Addition demandée ✓",
    cancelling: "Annulation...",
    cancelled: "Demande annulée",
    callFailed: "Échec. Réessayez.",
    cancelFailed: "Aucune demande active.",
    rateLimited: "Trop de demandes. Patientez.",
    menuSoon: "Carte bientôt disponible.",
    menuUnavailableTitle: "Carte",
    menuUnavailable:
      "La carte numérique n'est pas disponible pour le moment. Demandez un menu papier au personnel ou réessayez plus tard.",
    ingredients: "Ingrédients",
    allergens: "Allergènes",
    close: "Fermer",
    language: "Langue",
    poweredBy: "Powered by",
    back: "Retour",
    backToMenu: "Retour au menu",
    menuTop: "Haut",
    heroWelcome: "Bienvenue",
    heroHint: "Appuyez sur un plat pour les détails, ingrédients et allergènes.",
    footerDigitalMenu: "Menu numérique",
    footerHome: "Accueil menu",
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
