import type { WaiterCall, WaiterCallType } from "@menuos/db";
import { formatWaiterCallLocation } from "@menuos/shared";
import { pushWaiterCallToStaff } from "@/lib/staff-push-dispatch";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { logWaiterCallPush } from "@/lib/push-diagnostics";

export type StaffWaiterNotifyReason = "new" | "reopened" | "order_updated";

export function fireStaffPushNotify(task: () => Promise<void>) {
  void task().catch((err) => console.error("[menuos-staff-push]", err));
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
  venue: { id: string; name: string; slug: string; staffToken: string };
  call: Pick<WaiterCall, "id" | "type" | "tableNumber" | "roomNumber" | "sunbedNumber">;
  reason: StaffWaiterNotifyReason;
}) {
  const loc = formatWaiterCallLocation(input.call);
  const title = typeTitle(input.call.type, input.reason);
  const body = `${input.venue.name} · ${loc}`;
  const payload = JSON.stringify({
    title,
    body,
    url: buildStaffWaiterUrl(input.venue.slug, input.venue.staffToken),
    tag: `waiter-${input.call.id}`,
  });

  logWaiterCallPush({
    organizationId: input.organizationId,
    venueId: input.venue.id,
    callId: input.call.id,
    callType: input.call.type,
    location: loc,
    reason: input.reason,
  });

  await pushWaiterCallToStaff({
    organizationId: input.organizationId,
    venueId: input.venue.id,
    venue: { slug: input.venue.slug, staffToken: input.venue.staffToken, name: input.venue.name },
    payload,
    callId: input.call.id,
    callType: input.call.type,
    location: loc,
  });
}
