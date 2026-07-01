import type { PassSignal, PassStation } from "@menuos/db";
import { prisma } from "@menuos/db";
import webpush from "web-push";
import { formatWaiterCallLocation, passStationDbToInput } from "@menuos/shared";
import { configureWebPush, isPushEnabled } from "@/lib/push-config";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { fireStaffPushNotify } from "@/lib/staff-push-notify";

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
  if (!isPushEnabled() || !configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { organizationId: venue.organizationId },
  });
  if (subscriptions.length === 0) return;

  const loc = formatWaiterCallLocation(signal);
  const stationName = signal.stationScreen?.label?.trim();
  const title = stationName ? `${stationTitle(signal.station)} (${stationName})` : stationTitle(signal.station);
  const detail = signal.message?.trim();
  const body = detail ? `${loc} · ${detail}` : `${venue.name} · ${loc}`;
  const url = buildStaffWaiterUrl(venue.slug, venue.staffToken);
  const payload = JSON.stringify({
    title,
    body,
    url,
    tag: `pass-${signal.id}`,
  });

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) staleEndpoints.push(sub.endpoint);
        else console.error("[menuos-pass-push] send failed", sub.endpoint.slice(0, 48), err);
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }
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
