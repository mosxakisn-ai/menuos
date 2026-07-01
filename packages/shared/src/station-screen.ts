import { z } from "zod";
import { passStationInputSchema, type PassStationInput } from "./pass-signal";

export const STATION_SCREEN_LABEL_MAX = 40;
export const STATION_SCREENS_MAX_PER_STATION = 12;

export const DEFAULT_STATION_SCREEN_LABELS_EL: Record<PassStationInput, string> = {
  kitchen: "Κουζίνα",
  bar: "Μπαρ",
  cold: "Κρύα",
  dessert: "Γλυκά",
};

export const stationScreenLabelSchema = z
  .string()
  .trim()
  .min(1, "Βάλε όνομα οθόνης.")
  .max(STATION_SCREEN_LABEL_MAX, `Μέγιστο ${STATION_SCREEN_LABEL_MAX} χαρακτήρες.`);

export const stationScreenCreateSchema = z.object({
  station: passStationInputSchema,
  label: stationScreenLabelSchema,
});

export const stationScreenUpdateSchema = z.object({
  label: stationScreenLabelSchema,
});

export type StationScreenCreateInput = z.infer<typeof stationScreenCreateSchema>;
export type StationScreenUpdateInput = z.infer<typeof stationScreenUpdateSchema>;
