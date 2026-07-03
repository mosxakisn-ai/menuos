import type { PassSignal, PassStation } from "@menuos/db";
import { formatWaiterCallLocation, passPushTitle, passStationDbToInput, stationDisplayLabel } from "@menuos/shared";
import { fireStaffPushNotify } from "@/lib/staff-push-notify";
import { pushPassSignalToStaff } from "@/lib/staff-push-dispatch";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

export function pushStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "message"
  > & {
    stationScreen?: { label: string } | null;
  },
) {
  fireStaffPushNotify(() => notifyStaffPassSignal(venue, signal));
}

async function notifyStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "message"
  > & {
    stationScreen?: { label: string } | null;
  },
) {
  const opsConfig = await getVenueOperationsConfig(venue.id);
  const stationInput = passStationDbToInput(signal.station);
  const loc = formatWaiterCallLocation(signal);
  const screenName = signal.stationScreen?.label?.trim();
  const baseTitle = passPushTitle(opsConfig, stationInput);
  const title = screenName ? `${baseTitle} (${screenName})` : baseTitle;
  const detail = signal.message?.trim();
  const body = detail ? `${loc} · ${detail}` : `${venue.name} · ${loc}`;
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
    location: loc,
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
