import { z } from "zod";

export const PASS_STATION_INPUTS = ["kitchen", "bar", "cold", "dessert"] as const;
export type PassStationInput = (typeof PASS_STATION_INPUTS)[number];

export const passStationInputSchema = z.enum(PASS_STATION_INPUTS);

export const passSignalCreateSchema = z
  .object({
    venueSlug: z.string().min(1).max(60).optional(),
    venueId: z.string().min(1).optional(),
    station: passStationInputSchema,
    stationKey: z.string().min(1).max(80).optional(),
    tableNumber: z.string().max(20).optional(),
    roomNumber: z.string().max(20).optional(),
    sunbedNumber: z.string().max(20).optional(),
    message: z.string().max(80).optional(),
    /** KDS active zone — used to filter push recipients. */
    zoneId: z.string().trim().max(60).optional(),
    /** When set, push only to these staff member ids (must be eligible for zone/station). */
    notifyStaffMemberIds: z.array(z.string().min(1).max(80)).max(40).optional(),
  })
  .refine((d) => Boolean(d.venueSlug?.trim() || d.venueId?.trim()), {
    message: "venueSlug or venueId required",
  })
  .refine(
    (d) => {
      const n = [d.tableNumber, d.roomNumber, d.sunbedNumber].filter((v) => v?.trim()).length;
      return n === 1;
    },
    { message: "Exactly one location field required" },
  );

export const passSignalStatusUpdateSchema = z.object({
  status: z.enum(["PICKED_UP", "DELIVERED"]),
  staffKey: z.string().min(1).max(80).optional(),
});

export const passSignalStationCancelSchema = z.object({
  venueSlug: z.string().min(1).max(60),
  station: passStationInputSchema,
  stationKey: z.string().min(1).max(80),
});

/** KDS bulk dismiss — same auth as single cancel, explicit signal ids from active zone. */
export const passSignalBulkDismissSchema = passSignalStationCancelSchema.extend({
  signalIds: z.array(z.string().min(1).max(80)).min(1).max(100),
});

export function passStationInputToDb(station: PassStationInput): "KITCHEN" | "BAR" | "COLD" | "DESSERT" {
  return station.toUpperCase() as "KITCHEN" | "BAR" | "COLD" | "DESSERT";
}

export function passStationDbToInput(station: string): PassStationInput {
  return station.toLowerCase() as PassStationInput;
}

export const PASS_SIGNAL_ACTIVE_STATUSES = ["READY", "PICKED_UP"] as const;
