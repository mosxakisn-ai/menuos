/** Greek preset → short English phrase for mobile TTS (en-US). */
const VOICE_PHRASE_EL_TO_EN: Record<string, string> = {
  σερβιρίστηκε: "served",
  σερβιριστηκε: "served",
  "ακύρωση από πελάτη": "customer cancellation",
  "ακυρωση απο πελατη": "customer cancellation",
  "φέρε πάγο": "bring ice",
  "φερε παγο": "bring ice",
  "πάρε πάγο": "get ice",
  "παρε παγο": "get ice",
  "έτοιμο ποτό": "drink ready",
  "ετοιμο ποτο": "drink ready",
  "αλλαγή ποτού": "drink change",
  "αλλαγη ποτου": "drink change",
  "έτοιμο": "ready",
  ετοιμο: "ready",
  "πήγαινε": "go now",
  πηγαινε: "go now",
  "λογαριασμός": "bill please",
  λογαριασμος: "bill please",
};

/** Common single-word tokens for composed phrases. */
const VOICE_WORD_EL_TO_EN: Record<string, string> = {
  έτοιμο: "ready",
  ετοιμο: "ready",
  ποτό: "drink",
  ποτο: "drink",
  ποτού: "drink",
  ποτου: "drink",
  πάγο: "ice",
  παγο: "ice",
  πάρε: "get",
  παρε: "get",
  φέρε: "bring",
  φερε: "bring",
  αλλαγή: "change",
  αλλαγη: "change",
  σερβιρίστηκε: "served",
  σερβιριστηκε: "served",
  κουζίνα: "kitchen",
  κουζινα: "kitchen",
  μπαρ: "bar",
  τραπέζι: "table",
  τραπεζι: "table",
  πελάτη: "customer",
  πελατη: "customer",
  ακύρωση: "cancellation",
  ακυρωση: "cancellation",
};

const STATION_VOICE_EN: Record<string, string> = {
  kitchen: "kitchen",
  bar: "bar",
  cold: "cold station",
  dessert: "dessert",
  services: "service",
};

function normalizeLookupKey(value: string): string {
  return value.trim().toLocaleLowerCase("el-GR");
}

function normalizeWordKey(word: string): string {
  return normalizeLookupKey(word.replace(/^[^A-Za-zΑ-Ωα-ωά-ώΆ-Ώ0-9]+|[^A-Za-zΑ-Ωα-ωά-ώΆ-Ώ0-9]+$/g, ""));
}

function translateWords(text: string): string | null {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const translated = words.map((word) => {
    const key = normalizeWordKey(word);
    if (!key) return null;
    return VOICE_WORD_EL_TO_EN[key] ?? VOICE_PHRASE_EL_TO_EN[key] ?? null;
  });
  if (translated.some((part) => !part)) return null;
  return translated.join(" ");
}

/** Greek (or ASCII) message → short English for waiter earpiece TTS. */
export function translateMessageForVoice(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const key = normalizeLookupKey(trimmed.replace(/[.!?,;:]+$/g, ""));
  if (VOICE_PHRASE_EL_TO_EN[key]) return VOICE_PHRASE_EL_TO_EN[key]!;
  if (/^[\x00-\x7F]+$/.test(trimmed)) return trimmed;
  const fromWords = translateWords(trimmed);
  if (fromWords) return fromWords;
  return "new message";
}

/** Whether we can speak a useful English preview (not generic fallback). */
export function canTranslateMessageForVoice(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^[\x00-\x7F]+$/.test(trimmed)) return true;
  const key = normalizeLookupKey(trimmed.replace(/[.!?,;:]+$/g, ""));
  if (VOICE_PHRASE_EL_TO_EN[key]) return true;
  return translateWords(trimmed) !== null;
}

function translateVoicePhrase(text: string): string {
  return translateMessageForVoice(text);
}

function parsePrefixedMessage(message: string): { source?: string; body: string } {
  const colon = message.indexOf(":");
  if (colon <= 0) return { body: message.trim() };
  const source = message.slice(0, colon).trim();
  const body = message.slice(colon + 1).trim();
  if (!body) return { body: message.trim() };
  return { source, body };
}

function spotVoiceLabel(input: {
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
}): string | null {
  const table = input.tableNumber?.trim();
  if (table) return `Table ${table}`;
  const room = input.roomNumber?.trim();
  if (room) return `Room ${room}`;
  const sunbed = input.sunbedNumber?.trim();
  if (sunbed) return `Sunbed ${sunbed}`;
  return null;
}

export type PassVoiceInput = {
  message?: string | null;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
  station?: string | null;
  stationScreenLabel?: string | null;
};

/** Short English line for waiter earpiece TTS. */
export function buildPassVoiceAnnouncement(input: PassVoiceInput): string | null {
  const rawMessage = input.message?.trim();
  if (!rawMessage) return null;

  const spot = spotVoiceLabel(input);
  const { source, body } = parsePrefixedMessage(rawMessage);
  const phrase = translateVoicePhrase(body);

  const stationKey = input.station?.trim().toLowerCase();
  const stationEn =
    (stationKey && STATION_VOICE_EN[stationKey]) ||
    input.stationScreenLabel?.trim() ||
    source?.trim() ||
    null;

  const parts = [spot, stationEn, phrase].filter((part): part is string => Boolean(part?.trim()));
  if (parts.length === 0) return phrase;
  return parts.join(", ");
}
