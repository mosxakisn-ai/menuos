import type { PassSignal, PassStation } from "@menuos/db";
import {
  buildPassSignalPushCopy,
  groupVenueSpotsByZone,
  passStationDbToInput,
  stationDisplayLabel,
} from "@menuos/shared";
import { fireStaffPushNotify } from "@/lib/staff-push-notify";
import { pushPassSignalToStaff } from "@/lib/staff-push-dispatch";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { prisma } from "@menuos/db";

export function pushStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "message"
  > & {
    stationScreen?: { label: string } | null;
  },
  opts?: { notifyStaffMemberIds?: string[]; zoneId?: string | null },
) {
  fireStaffPushNotify(() => notifyStaffPassSignal(venue, signal, opts));
}

async function notifyStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "message"
  > & {
    stationScreen?: { label: string } | null;
  },
  opts?: { notifyStaffMemberIds?: string[]; zoneId?: string | null },
) {
  const spots = await prisma.venueSpot.findMany({
    where: { venueId: venue.id },
    select: { type: true, label: true },
    orderBy: { sortOrder: "asc" },
  });
  const zoneGroups = groupVenueSpotsByZone(spots);
  const { title, body } = buildPassSignalPushCopy(signal, {
    zoneGroups,
    activeZoneId: opts?.zoneId ?? null,
  });
  const payload = JSON.stringify({
    title,
    body,
    url: buildStaffWaiterUrl(venue.slug, venue.staffToken),
    tag: `pass-${signal.id}`,
  });

  await pushPassSignalToStaff({
    organizationId: venue.organizationId,
    venueId: venue.id,
    venue: { slug: venue.slug, staffToken: venue.staffToken, name: venue.name },
    station: signal.station,
    payload,
    signalId: signal.id,
    location: body,
    notifyStaffMemberIds: opts?.notifyStaffMemberIds,
  });
}

export async function passStationLabel(
  venueId: string,
  station: PassStation,
  lang: "GR" | "EN" = "GR",
): Promise<string> {
  const opsConfig = await getVenueOperationsConfig(venueId);
  return stationDisplayLabel(opsConfig, passStationDbToInput(station), lang);
}
