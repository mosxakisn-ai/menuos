import type { PassSignal, PassStation } from "@menuos/db";
import { passStationDbToInput, stationDisplayLabel } from "@menuos/shared";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import {
  dispatchPassSignalPush,
  persistPassSignalPushStats,
} from "@/lib/pass-signal-delivery-service";

export async function pushStaffPassSignal(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: Pick<
    PassSignal,
    "id" | "station" | "tableNumber" | "roomNumber" | "sunbedNumber" | "zoneId" | "message"
  > & {
    stationScreen?: { label: string } | null;
    notifyStaffMemberIds?: string[];
  },
  opts?: { notifyStaffMemberIds?: string[]; zoneId?: string | null },
) {
  const result = await dispatchPassSignalPush(venue, signal, {
    notifyStaffMemberIds: opts?.notifyStaffMemberIds,
  });
  await persistPassSignalPushStats(signal.id, result);
}

export async function passStationLabel(
  venueId: string,
  station: PassStation,
  lang: "GR" | "EN" = "GR",
): Promise<string> {
  const opsConfig = await getVenueOperationsConfig(venueId);
  return stationDisplayLabel(opsConfig, passStationDbToInput(station), lang);
}
