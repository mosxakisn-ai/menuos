import type { WaiterCall } from "@menuos/db";
import {
  fireStaffPushNotify,
  notifyStaffWaiterCall,
  type StaffWaiterNotifyReason,
} from "@/lib/staff-push-notify";

type VenueForPush = { id: string; name: string; organizationId: string };

export function pushStaffWaiterCall(
  venue: VenueForPush,
  call: Pick<WaiterCall, "id" | "type" | "tableNumber" | "roomNumber" | "sunbedNumber">,
  reason: StaffWaiterNotifyReason,
) {
  fireStaffPushNotify(() =>
    notifyStaffWaiterCall({
      organizationId: venue.organizationId,
      venue: { id: venue.id, name: venue.name },
      call,
      reason,
    }),
  );
}
