import type { WaiterCall, WaiterCallType } from "@menuos/db";
import { prisma } from "@menuos/db";
import webpush from "web-push";
import { formatWaiterCallLocation } from "@menuos/shared";
import { configureWebPush, isPushEnabled } from "@/lib/push-config";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";

export type StaffWaiterNotifyReason = "new" | "reopened" | "order_updated";

export function fireStaffPushNotify(task: () => Promise<void>) {
  void task().catch((err) => console.error("[menuos-staff-push]", err));
}

function typeTitle(type: WaiterCallType, reason: StaffWaiterNotifyReason): string {  if (reason === "order_updated") return "Ενημέρωση παραγγελίας";
  if (reason === "reopened" && type === "ORDER") return "Νέα παραγγελία";
  switch (type) {
    case "WAITER":
      return "Κλήση σερβιτόρου";
    case "BILL":
      return "Αίτηση λογαριασμού";
    case "ORDER":
      return "Νέα παραγγελία";
    default:
      return "Νέα κλήση";
  }
}

export async function notifyStaffWaiterCall(input: {
  organizationId: string;
  venue: { id: string; name: string; slug: string; staffToken: string };
  call: Pick<WaiterCall, "id" | "type" | "tableNumber" | "roomNumber" | "sunbedNumber">;
  reason: StaffWaiterNotifyReason;
}) {
  if (!isPushEnabled() || !configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { organizationId: input.organizationId },
  });
  if (subscriptions.length === 0) return;

  const loc = formatWaiterCallLocation(input.call);
  const title = typeTitle(input.call.type, input.reason);
  const body = `${input.venue.name} · ${loc}`;
  const url = buildStaffWaiterUrl(input.venue.slug, input.venue.staffToken);
  const payload = JSON.stringify({
    title,
    body,
    url,
    tag: `waiter-${input.call.id}`,
  });

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          staleEndpoints.push(sub.endpoint);
          return;
        }
        console.error("[menuos-staff-push] send failed", sub.endpoint.slice(0, 48), err);
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }
}
