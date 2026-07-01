import type { PassSignal, PassStation } from "@menuos/db";
import { formatWaiterCallLocation, passStationDbToInput } from "@menuos/shared";
import { fireStaffPushNotify } from "@/lib/staff-push-notify";
import { pushPassSignalToStaff } from "@/lib/staff-push-dispatch";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";

function stationTitle(station: PassStation): string {
  switch (station) {
    case "KITCHEN":
      return "Έλα πάσο — κουζίνα";
    case "BAR":
      return "Έτοιμο το ποτό";
    case "COLD":
      return "Έτοιμο — κρύα";
    case "DESSERT":
      return "Έτοιμο — γλυκά";
    default:
      return "Ειδοποίηση πάσου";
  }
}

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
  const loc = formatWaiterCallLocation(signal);
  const stationName = signal.stationScreen?.label?.trim();
  const title = stationName ? `${stationTitle(signal.station)} (${stationName})` : stationTitle(signal.station);
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
    venue: { slug: venue.slug, staffToken: venue.staffToken },
    station: signal.station,
    payload,
  });
}

export function passStationLabel(station: PassStation, lang: "GR" | "EN"): string {
  const input = passStationDbToInput(station);
  const labels: Record<string, { GR: string; EN: string }> = {
    kitchen: { GR: "Κουζίνα", EN: "Kitchen" },
    bar: { GR: "Μπαρ", EN: "Bar" },
    cold: { GR: "Κρύα", EN: "Cold" },
    dessert: { GR: "Γλυκά", EN: "Dessert" },
  };
  return labels[input]?.[lang] ?? station;
}
