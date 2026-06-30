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

export function formatVenueSpotLabel(type: VenueSpotType, label: string): string {
  return `${venueSpotTypeLabel(type)} ${label}`;
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
  if (call.tableNumber) return `Τραπέζι ${call.tableNumber}`;
  if (call.roomNumber) return `Δωμάτιο ${call.roomNumber}`;
  if (call.sunbedNumber) return `Ξαπλώστρα ${call.sunbedNumber}`;
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
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
}): { tableNumber?: string; roomNumber?: string; sunbedNumber?: string } {
  const sunbed = input.sunbedNumber?.trim();
  if (sunbed) return { sunbedNumber: sunbed };
  const room = input.roomNumber?.trim();
  if (room) return { roomNumber: room };
  const table = input.tableNumber?.trim();
  if (table) return { tableNumber: table };
  return {};
}
