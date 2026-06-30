import type { WaiterCall, WaiterCallType } from "@menuos/db";
import { prisma } from "@menuos/db";
import webpush from "web-push";
import { APP_URL } from "@/lib/config";
import { configureWebPush, isPushEnabled } from "@/lib/push-config";

export type StaffWaiterNotifyReason = "new" | "reopened" | "order_updated";

export function fireStaffPushNotify(task: () => Promise<void>) {
  void task().catch((err) => console.error("[menuos-staff-push]", err));
}

function locationLabel(call: Pick<WaiterCall, "tableNumber" | "roomNumber">): string {
  if (call.tableNumber) return `Τραπέζι ${call.tableNumber}`;
  if (call.roomNumber) return `Δωμάτιο ${call.roomNumber}`;
  return "—";
}

function typeTitle(type: WaiterCallType, reason: StaffWaiterNotifyReason): string {
  if (reason === "order_updated") return "Ενημέρωση παραγγελίας";
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
  venue: { id: string; name: string };
  call: Pick<WaiterCall, "id" | "type" | "tableNumber" | "roomNumber">;
  reason: StaffWaiterNotifyReason;
}) {
  if (!isPushEnabled() || !configureWebPush()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { organizationId: input.organizationId },
  });
  if (subscriptions.length === 0) return;

  const loc = locationLabel(input.call);
  const title = typeTitle(input.call.type, input.reason);
  const body = `${input.venue.name} · ${loc}`;
  const url = `${APP_URL.replace(/\/$/, "")}/dashboard/waiter?venue=${input.venue.id}`;
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
