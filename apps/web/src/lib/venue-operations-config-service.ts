import { prisma } from "@menuos/db";
import {
  listVenuePosts,
  mergeVenueOperationsConfig,
  normalizeVenueOperationsConfig,
  sanitizeStaffAssignments,
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

  const normalized = normalizeVenueOperationsConfig(parsed.data);

  await prisma.venueSetting.upsert({
    where: { venueId },
    create: { venueId, operationsConfig: normalized },
    update: { operationsConfig: normalized },
  });

  await sanitizeVenueStaffAssignments(venueId, normalized);

  return normalized;
}

async function sanitizeVenueStaffAssignments(
  venueId: string,
  config: VenueOperationsConfig,
): Promise<void> {
  const posts = listVenuePosts(config);
  const members = await prisma.venueStaffMember.findMany({
    where: { venueId },
    select: { id: true, stations: true },
  });
  if (members.length === 0) return;

  await Promise.all(
    members.map((member) => {
      const sanitized = sanitizeStaffAssignments(member.stations, posts);
      if (
        sanitized.length === member.stations.length &&
        sanitized.every((station, index) => station === member.stations[index])
      ) {
        return Promise.resolve();
      }
      return prisma.venueStaffMember.update({
        where: { id: member.id },
        data: { stations: sanitized },
      });
    }),
  );
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
