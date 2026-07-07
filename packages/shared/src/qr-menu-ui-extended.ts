import { QR_MENU_UI, type QrMenuLanguage, type QrMenuUiStrings } from "./menu-languages";

type WidenStringFields<T> = {
  [K in keyof T]: T[K] extends string ? string : T[K];
};

type UiPatch = Partial<
  WidenStringFields<
    Omit<QrMenuUiStrings, "table" | "room" | "sunbed" | "cancelCallType" | "cartSummary">
  >
> & {
  table?: QrMenuUiStrings["table"];
  room?: QrMenuUiStrings["room"];
  sunbed?: QrMenuUiStrings["sunbed"];
  cancelCallType?: QrMenuUiStrings["cancelCallType"];
  cartSummary?: QrMenuUiStrings["cartSummary"];
};

function extendQrMenuUi(base: QrMenuUiStrings, patch: UiPatch): QrMenuUiStrings {
  return {
    ...base,
    ...patch,
    table: patch.table ?? base.table,
    room: patch.room ?? base.room,
    sunbed: patch.sunbed ?? base.sunbed,
    cancelCallType: patch.cancelCallType ?? base.cancelCallType,
    cartSummary: patch.cartSummary ?? base.cartSummary,
  } as QrMenuUiStrings;
}

const EN = QR_MENU_UI.EN;

const EXTENDED: Partial<Record<QrMenuLanguage, QrMenuUiStrings>> = {
  PL: extendQrMenuUi(EN, {
    table: (n) => `Stolik ${n}`,
    room: (n) => `Pokój ${n}`,
    sunbed: (n) => `Leżak ${n}`,
    callWaiter: "Wezwij kelnera",
    callWaiterShort: "Kelner",
    requestBill: "Rachunek",
    cancelCall: "Anuluj",
    calling: "Wysyłanie...",
    called: "Kelner powiadomiony ✓",
    billSent: "Poproszono o rachunek ✓",
    menuUnavailable: "Menu cyfrowe jest chwilowo niedostępne.",
    ingredients: "Składniki",
    allergens: "Alergeny",
    close: "Zamknij",
    language: "Język",
    heroWelcome: "Witamy",
    addToCart: "Dodaj do koszyka",
    cart: "Koszyk",
    sendOrder: "Wyślij zamówienie",
    orderSent: "Zamówienie wysłane ✓",
  }),
  CS: extendQrMenuUi(EN, {
    table: (n) => `Stůl ${n}`,
    room: (n) => `Pokoj ${n}`,
    callWaiter: "Zavolat číšníka",
    callWaiterShort: "Číšník",
    requestBill: "Účet",
    cancelCall: "Zrušit",
    ingredients: "Ingredience",
    allergens: "Alergeny",
    language: "Jazyk",
    heroWelcome: "Vítejte",
    addToCart: "Přidat do košíku",
    cart: "Košík",
    sendOrder: "Odeslat objednávku",
    orderSent: "Objednávka odeslána ✓",
  }),
  IT: extendQrMenuUi(EN, {
    table: (n) => `Tavolo ${n}`,
    room: (n) => `Camera ${n}`,
    sunbed: (n) => `Lettino ${n}`,
    callWaiter: "Chiama cameriere",
    callWaiterShort: "Cameriere",
    requestBill: "Conto",
    cancelCall: "Annulla",
    ingredients: "Ingredienti",
    allergens: "Allergeni",
    language: "Lingua",
    heroWelcome: "Benvenuti",
    addToCart: "Aggiungi al carrello",
    cart: "Carrello",
    sendOrder: "Invia ordine",
    orderSent: "Ordine inviato ✓",
  }),
  SV: extendQrMenuUi(EN, {
    table: (n) => `Bord ${n}`,
    room: (n) => `Rum ${n}`,
    callWaiter: "Ring servitör",
    callWaiterShort: "Servitör",
    requestBill: "Notan",
    cancelCall: "Avbryt",
    ingredients: "Ingredienser",
    allergens: "Allergener",
    language: "Språk",
    heroWelcome: "Välkommen",
    addToCart: "Lägg i varukorg",
    cart: "Varukorg",
    sendOrder: "Skicka beställning",
    orderSent: "Beställning skickad ✓",
  }),
  FI: extendQrMenuUi(EN, {
    table: (n) => `Pöytä ${n}`,
    room: (n) => `Huone ${n}`,
    callWaiter: "Kutsu tarjoilija",
    callWaiterShort: "Tarjoilija",
    requestBill: "Lasku",
    cancelCall: "Peruuta",
    ingredients: "Ainekset",
    allergens: "Allergeenit",
    language: "Kieli",
    heroWelcome: "Tervetuloa",
    addToCart: "Lisää koriin",
    cart: "Kori",
    sendOrder: "Lähetä tilaus",
    orderSent: "Tilaus lähetetty ✓",
  }),
  TR: extendQrMenuUi(EN, {
    table: (n) => `Masa ${n}`,
    room: (n) => `Oda ${n}`,
    callWaiter: "Garson çağır",
    callWaiterShort: "Garson",
    requestBill: "Hesap",
    cancelCall: "İptal",
    ingredients: "İçindekiler",
    allergens: "Alerjenler",
    language: "Dil",
    heroWelcome: "Hoş geldiniz",
    addToCart: "Sepete ekle",
    cart: "Sepet",
    sendOrder: "Sipariş gönder",
    orderSent: "Sipariş gönderildi ✓",
  }),
};

export function getQrMenuUi(lang: QrMenuLanguage): QrMenuUiStrings {
  const core = QR_MENU_UI[lang as keyof typeof QR_MENU_UI];
  if (core) return core as QrMenuUiStrings;
  return (EXTENDED[lang] ?? EN) as QrMenuUiStrings;
}
