/** Greek preset → short English phrase for mobile TTS (en-US). */
const VOICE_PHRASE_EL_TO_EN: Record<string, string> = {
  σερβιρίστηκε: "served",
  σερβιριστηκε: "served",
  "ακύρωση από πελάτη": "customer cancellation",
  "ακυρωση απο πελατη": "customer cancellation",
  "φέρε πάγο": "bring ice",
  "φερε παγο": "bring ice",
  "έτοιμο": "ready",
  ετοιμο: "ready",
  "πήγαινε": "go now",
  πηγαινε: "go now",
  "λογαριασμός": "bill please",
  λογαριασμος: "bill please",
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

function translateVoicePhrase(text: string): string {
  const key = normalizeLookupKey(text);
  if (VOICE_PHRASE_EL_TO_EN[key]) return VOICE_PHRASE_EL_TO_EN[key]!;
  if (/^[\x00-\x7F]+$/.test(text.trim())) return text.trim();
  return "new message";
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
