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
  français: "FR",
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
    sunbed: (n: string) => `Ξαπλώστρα ${n}`,
    callWaiter: "Κλήση σερβιτόρου",
    callWaiterShort: "Σερβιτόρος",
    requestBill: "Λογαριασμός",
    cancelCall: "Ακύρωση",
    cancelCallType: (type: "ORDER" | "WAITER" | "BILL") =>
      type === "ORDER"
        ? "Ακύρωση παραγγελίας"
        : type === "WAITER"
          ? "Ακύρωση κλήσης"
          : "Ακύρωση λογαριασμού",
    calling: "Αποστολή...",
    called: "Ο σερβιτόρος ειδοποιήθηκε ✓",
    calledShort: "Εστάλη!",
    billSent: "Ζητήθηκε λογαριασμός ✓",
    cancelling: "Ακύρωση...",
    cancelled: "Η κλήση ακυρώθηκε",
    callFailed: "Αποτυχία. Δοκίμασε ξανά.",
    cancelFailed: "Δεν ήταν δυνατή η ακύρωση.",
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
    heroHint: "Επιλέξτε πιάτο, βάλτε ποσότητα και προσθέστε στο καλάθι. Στείλτε παραγγελία ή καλέστε σερβιτόρο.",
    quantity: "Ποσότητα",
    addToCart: "Προσθήκη στο καλάθι",
    addedToCart: "Προστέθηκε ✓",
    cart: "Καλάθι",
    cartEmpty: "Το καλάθι είναι άδειο",
    sendOrder: "Αποστολή παραγγελίας",
    orderSending: "Αποστολή...",
    orderSent: "Η παραγγελία εστάλη ✓",
    orderFailed: "Αποτυχία παραγγελίας. Δοκίμασε ξανά.",
    orderInProgress: "Νέα πιάτα προστίθενται στην τρέχουσα παραγγελία.",
    yourOrder: "Η παραγγελία σου",
    yourOrderHint: "Αποστάλθηκε στο κατάστημα — μπορείς να προσθέσεις κι άλλα πιάτα.",
    orderTypeMismatch: "Υπάρχει ενεργή κλήση — περίμενε ή ακύρωσε.",
    cartSummary: (count: number, total: string) => `${count} πιάτα · €${total}`,
    viewCart: "Δες καλάθι",
    decreaseQty: "Μείωση",
    increaseQty: "Αύξηση",
    removeFromCart: "Αφαίρεση",
    footerDigitalMenu: "Ψηφιακό menu",
    footerHome: "Αρχή menu",
  },
  EN: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Room ${n}`,
    sunbed: (n: string) => `Sunbed ${n}`,
    callWaiter: "Call waiter",
    callWaiterShort: "Waiter",
    requestBill: "Bill",
    cancelCall: "Cancel",
    cancelCallType: (type: "ORDER" | "WAITER" | "BILL") =>
      type === "ORDER"
        ? "Cancel order"
        : type === "WAITER"
          ? "Cancel waiter call"
          : "Cancel bill request",
    calling: "Calling...",
    called: "Waiter notified ✓",
    calledShort: "Sent!",
    billSent: "Bill requested ✓",
    cancelling: "Cancelling...",
    cancelled: "Request cancelled",
    callFailed: "Failed. Please try again.",
    cancelFailed: "Could not cancel the request.",
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
    heroHint: "Pick a dish, set quantity and add to cart. Send your order or call the waiter.",
    quantity: "Quantity",
    addToCart: "Add to cart",
    addedToCart: "Added ✓",
    cart: "Cart",
    cartEmpty: "Your cart is empty",
    sendOrder: "Send order",
    orderSending: "Sending...",
    orderSent: "Order sent ✓",
    orderFailed: "Order failed. Try again.",
    orderInProgress: "New items will be added to your current order.",
    yourOrder: "Your order",
    yourOrderHint: "Sent to the venue — you can still add more items.",
    orderTypeMismatch: "There is an active request — wait or cancel it.",
    cartSummary: (count: number, total: string) => `${count} items · €${total}`,
    viewCart: "View cart",
    decreaseQty: "Decrease",
    increaseQty: "Increase",
    removeFromCart: "Remove",
    footerDigitalMenu: "Digital menu",
    footerHome: "Menu home",
  },
  DE: {
    table: (n: string) => `Tisch ${n}`,
    room: (n: string) => `Zimmer ${n}`,
    sunbed: (n: string) => `Liege ${n}`,
    callWaiter: "Kellner rufen",
    callWaiterShort: "Kellner",
    requestBill: "Rechnung",
    cancelCall: "Abbrechen",
    cancelCallType: (type: "ORDER" | "WAITER" | "BILL") =>
      type === "ORDER"
        ? "Bestellung abbrechen"
        : type === "WAITER"
          ? "Kellnerruf abbrechen"
          : "Rechnung abbrechen",
    calling: "Senden...",
    called: "Kellner benachrichtigt ✓",
    calledShort: "Gesendet!",
    billSent: "Rechnung angefordert ✓",
    cancelling: "Abbrechen...",
    cancelled: "Anfrage abgebrochen",
    callFailed: "Fehlgeschlagen. Bitte erneut versuchen.",
    cancelFailed: "Abbrechen nicht möglich.",
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
    heroHint: "Gericht wählen, Menge setzen, in den Warenkorb. Bestellung senden oder Kellner rufen.",
    quantity: "Menge",
    addToCart: "In den Warenkorb",
    addedToCart: "Hinzugefügt ✓",
    cart: "Warenkorb",
    cartEmpty: "Warenkorb ist leer",
    sendOrder: "Bestellung senden",
    orderSending: "Senden...",
    orderSent: "Bestellung gesendet ✓",
    orderFailed: "Bestellung fehlgeschlagen.",
    orderInProgress: "Neue Gerichte werden zur laufenden Bestellung hinzugefügt.",
    yourOrder: "Ihre Bestellung",
    yourOrderHint: "An das Lokal gesendet — Sie können weitere Gerichte hinzufügen.",
    orderTypeMismatch: "Aktive Anfrage — warten oder abbrechen.",
    cartSummary: (count: number, total: string) => `${count} Gerichte · €${total}`,
    viewCart: "Warenkorb",
    decreaseQty: "Weniger",
    increaseQty: "Mehr",
    removeFromCart: "Entfernen",
    footerDigitalMenu: "Digitale Speisekarte",
    footerHome: "Speisekarten-Start",
  },
  FR: {
    table: (n: string) => `Table ${n}`,
    room: (n: string) => `Chambre ${n}`,
    sunbed: (n: string) => `Transat ${n}`,
    callWaiter: "Appeler le serveur",
    callWaiterShort: "Serveur",
    requestBill: "Addition",
    cancelCall: "Annuler",
    cancelCallType: (type: "ORDER" | "WAITER" | "BILL") =>
      type === "ORDER"
        ? "Annuler la commande"
        : type === "WAITER"
          ? "Annuler l'appel serveur"
          : "Annuler l'addition",
    calling: "Envoi...",
    called: "Serveur prévenu ✓",
    calledShort: "Envoyé!",
    billSent: "Addition demandée ✓",
    cancelling: "Annulation...",
    cancelled: "Demande annulée",
    callFailed: "Échec. Réessayez.",
    cancelFailed: "Annulation impossible.",
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
    heroHint: "Choisissez un plat, la quantité, ajoutez au panier. Envoyez la commande ou appelez le serveur.",
    quantity: "Quantité",
    addToCart: "Ajouter au panier",
    addedToCart: "Ajouté ✓",
    cart: "Panier",
    cartEmpty: "Panier vide",
    sendOrder: "Envoyer la commande",
    orderSending: "Envoi...",
    orderSent: "Commande envoyée ✓",
    orderFailed: "Échec de la commande.",
    orderInProgress: "Les nouveaux plats s'ajoutent à la commande en cours.",
    yourOrder: "Votre commande",
    yourOrderHint: "Envoyée au restaurant — vous pouvez encore ajouter des plats.",
    orderTypeMismatch: "Demande active — attendez ou annulez.",
    cartSummary: (count: number, total: string) => `${count} plats · €${total}`,
    viewCart: "Voir le panier",
    decreaseQty: "Moins",
    increaseQty: "Plus",
    removeFromCart: "Retirer",
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
