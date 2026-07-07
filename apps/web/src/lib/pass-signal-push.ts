import type { PassSignal, PassStation } from "@menuos/db";
import {
  buildPassSignalAnnouncement,
  buildPassSignalPushCopy,
  applyZoneLabelOverrides,
  groupVenueSpotsByZone,
  passStationDbToInput,
  stationDisplayLabel,
} from "@menuos/shared";
import { fireStaffPushNotify } from "@/lib/staff-push-notify";
import { pushPassSignalToStaff } from "@/lib/staff-push-dispatch";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { getOrganizationNotificationSettings } from "@/lib/organization-notification-settings";
import { prisma } from "@menuos/db";

export function pushStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "zoneId" | "message"
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
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "zoneId" | "message"
  > & {
    stationScreen?: { label: string } | null;
  },
  opts?: { notifyStaffMemberIds?: string[]; zoneId?: string | null },
) {
  const opsConfig = await getVenueOperationsConfig(venue.id);
  const spots = await prisma.venueSpot.findMany({
    where: { venueId: venue.id },
    select: { type: true, label: true },
    orderBy: { sortOrder: "asc" },
  });
  const zoneGroups = applyZoneLabelOverrides(
    groupVenueSpotsByZone(spots),
    opsConfig.zoneLabels,
  );
  const activeZoneId = opts?.zoneId ?? signal.zoneId ?? null;
  const { title, body } = buildPassSignalPushCopy(signal, {
    zoneGroups,
    activeZoneId,
  });
  const orgNotifications = await getOrganizationNotificationSettings(venue.organizationId);
  const voiceEnabled = orgNotifications.voiceMessagesEnabled;
  const announcement = voiceEnabled
    ? buildPassSignalAnnouncement(signal, { zoneGroups, activeZoneId })
    : undefined;
  const payload = JSON.stringify({
    title,
    body,
    url: buildStaffWaiterUrl(venue.slug, venue.staffToken),
    tag: `pass-${signal.id}`,
    voiceEnabled,
    announcement: announcement?.trim() || undefined,
    passId: signal.id,
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
