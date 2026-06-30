export const VENUE_SPOT_TYPES = ["TABLE", "ROOM", "SUNBED"] as const;
export type VenueSpotType = (typeof VENUE_SPOT_TYPES)[number];

export const VENUE_SPOT_TYPE_LABELS_EL: Record<VenueSpotType, string> = {
  TABLE: "Τραπέζι",
  ROOM: "Δωμάτιο",
  SUNBED: "Ξαπλώστρα",
};

export function venueSpotTypeLabel(type: VenueSpotType): string {
  return VENUE_SPOT_TYPE_LABELS_EL[type] ?? type;
}

/** Pure numbers get a type prefix (e.g. «Τραπέζι 12»); custom ids show as-is (e.g. «sala-1»). */
export function formatVenueSpotLabel(type: VenueSpotType, label: string): string {
  const trimmed = label.trim();
  if (/^[0-9]+$/.test(trimmed)) return `${venueSpotTypeLabel(type)} ${trimmed}`;
  return trimmed;
}

const venueSpotLabelPattern = /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF_-]+$/;

export function isValidVenueSpotLabel(label: string): boolean {
  const trimmed = label.trim();
  return trimmed.length >= 1 && trimmed.length <= 20 && venueSpotLabelPattern.test(trimmed);
}

export const VENUE_SPOT_LABEL_HINT =
  "Μόνο γράμματα, αριθμοί, παύλα και κάτω παύλα (π.χ. 12, sala-1).";

function formatLocationValue(typeLabel: string, value: string): string {
  const trimmed = value.trim();
  if (/^[0-9]+$/.test(trimmed)) return `${typeLabel} ${trimmed}`;
  return trimmed;
}

export function spotToQueryParams(
  type: VenueSpotType,
  label: string,
): { table?: string; room?: string; sunbed?: string } {
  if (type === "TABLE") return { table: label };
  if (type === "ROOM") return { room: label };
  return { sunbed: label };
}

export type WaiterCallLocation = {
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
};

export function formatWaiterCallLocation(call: WaiterCallLocation): string {
  if (call.tableNumber) return formatLocationValue(VENUE_SPOT_TYPE_LABELS_EL.TABLE, call.tableNumber);
  if (call.roomNumber) return formatLocationValue(VENUE_SPOT_TYPE_LABELS_EL.ROOM, call.roomNumber);
  if (call.sunbedNumber) return formatLocationValue(VENUE_SPOT_TYPE_LABELS_EL.SUNBED, call.sunbedNumber);
  return "Χωρίς θέση";
}

export function hasMenuLocation(
  loc: { tableNumber?: string; roomNumber?: string; sunbedNumber?: string },
): boolean {
  return Boolean(loc.tableNumber || loc.roomNumber || loc.sunbedNumber);
}

export function countMenuLocationFields(loc: {
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
}): number {
  return [loc.tableNumber, loc.roomNumber, loc.sunbedNumber].filter((v) => v?.trim()).length;
}

/** One active location per call — sunbed wins over room over table if multiple are sent. */
export function normalizeWaiterCallLocation(input: {
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
}): { tableNumber?: string; roomNumber?: string; sunbedNumber?: string } {
  const sunbed = input.sunbedNumber?.trim();
  if (sunbed) return { sunbedNumber: sunbed };
  const room = input.roomNumber?.trim();
  if (room) return { roomNumber: room };
  const table = input.tableNumber?.trim();
  if (table) return { tableNumber: table };
  return {};
}

/** True when the request targets the same spot as the stored call (single-field match). */
export function waiterCallLocationMatches(
  call: WaiterCallLocation,
  request: { tableNumber?: string; roomNumber?: string; sunbedNumber?: string },
): boolean {
  const stored = normalizeWaiterCallLocation(call);
  const req = normalizeWaiterCallLocation(request);
  if (stored.tableNumber) return req.tableNumber === stored.tableNumber;
  if (stored.roomNumber) return req.roomNumber === stored.roomNumber;
  if (stored.sunbedNumber) return req.sunbedNumber === stored.sunbedNumber;
  return !req.tableNumber && !req.roomNumber && !req.sunbedNumber;
}
