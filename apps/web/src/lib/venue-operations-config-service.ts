import { prisma } from "@menuos/db";
import {
  mergeVenueOperationsConfig,
  normalizeVenueOperationsConfig,
  venueOperationsConfigPatchSchema,
  venueOperationsConfigSchema,
  type VenueOperationsConfig,
  type VenueOperationsConfigPatch,
} from "@menuos/shared";

export async function getVenueOperationsConfig(venueId: string): Promise<VenueOperationsConfig> {
  const row = await prisma.venueSetting.findUnique({
    where: { venueId },
    select: { operationsConfig: true },
  });
  return normalizeVenueOperationsConfig(row?.operationsConfig ?? null);
}

/** Full replace — UI always sends the complete config object. */
export async function saveVenueOperationsConfig(
  venueId: string,
  config: unknown,
): Promise<VenueOperationsConfig> {
  const parsed = venueOperationsConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error("Invalid operations config");
  }

  await prisma.venueSetting.upsert({
    where: { venueId },
    create: { venueId, operationsConfig: parsed.data },
    update: { operationsConfig: parsed.data },
  });

  return parsed.data;
}

export async function updateVenueOperationsConfig(
  venueId: string,
  patch: VenueOperationsConfigPatch,
): Promise<VenueOperationsConfig> {
  const patchParsed = venueOperationsConfigPatchSchema.safeParse(patch);
  if (!patchParsed.success) {
    throw new Error("Invalid operations config");
  }

  const current = await getVenueOperationsConfig(venueId);
  const merged = mergeVenueOperationsConfig(current, patchParsed.data);
  return saveVenueOperationsConfig(venueId, merged);
}

export async function assertPassStationEnabledForVenue(
  venueId: string,
  station: VenueOperationsConfig["enabledStations"][number],
): Promise<VenueOperationsConfig> {
  const config = await getVenueOperationsConfig(venueId);
  if (!config.enabledStations.includes(station)) {
    throw new Error("STATION_DISABLED");
  }
  return config;
}
