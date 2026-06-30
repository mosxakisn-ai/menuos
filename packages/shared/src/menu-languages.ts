/** Γλώσσες που εμφανίζονται στο public QR menu (front πελάτη). */
export const QR_MENU_LANGUAGES = ["GR", "EN"] as const;
export type QrMenuLanguage = (typeof QR_MENU_LANGUAGES)[number];

export const QR_MENU_LANGUAGE_LABELS: Record<
  QrMenuLanguage,
  { short: string; name: string; ariaLabel: string }
> = {
  GR: { short: "ΕΛ", name: "Ελληνικά", ariaLabel: "Ελληνικά" },
  EN: { short: "EN", name: "English", ariaLabel: "English" },
};

export function parseQrMenuLanguage(raw?: string | null): QrMenuLanguage {
  const v = raw?.trim().toLowerCase();
  if (v === "en" || v === "english" || v === "eng") return "EN";
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
    calling: "Αποστολή...",
    called: "Ο σερβιτόρος ειδοποιήθηκε ✓",
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
    calling: "Calling...",
    called: "Waiter notified ✓",
    menuSoon: "Menu coming soon.",
    ingredients: "Ingredients",
    allergens: "Allergens",
    close: "Close",
    language: "Language",
  },
} as const;

export type QrMenuUiStrings = (typeof QR_MENU_UI)[QrMenuLanguage];

/** Επιλογή μετάφρασης πιάτου/κατηγορίας με fallback GR → EN. */
export function pickQrMenuTranslation<T extends { language: string }>(
  translations: T[],
  lang: QrMenuLanguage,
): T | undefined {
  return (
    translations.find((t) => t.language === lang) ??
    translations.find((t) => t.language === "GR") ??
    translations.find((t) => t.language === "EN") ??
    translations[0]
  );
}
