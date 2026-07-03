import type { PassStation, WaiterCallType } from "@menuos/db";
import { passStationDbToInput } from "@menuos/shared";
import type { Prisma } from "@menuos/db";
import { logServerDiagnostic, recordClientDiagnostic } from "@/lib/client-diagnostics-service";

export type PushFlowKind = "pass_signal" | "waiter_call";

export type PushDispatchResult = {
  totalSubscriptions: number;
  targetCount: number;
  sent: number;
  failed: number;
  staleRemoved: number;
  skippedReason?: "push_disabled" | "no_subscriptions" | "no_targets";
};

const SLOW_PASS_SECONDS = 120;
const SLOW_WAITER_CALL_SECONDS = 180;

function stationLabel(station: PassStation): string {
  const key = passStationDbToInput(station);
  const labels: Record<string, string> = {
    kitchen: "Κουζίνα",
    bar: "Μπαρ",
    cold: "Κρύα",
    dessert: "Γλυκά",
  };
  return labels[key] ?? station;
}

function waiterCallTypeLabel(type: WaiterCallType): string {
  switch (type) {
    case "WAITER":
      return "Κλήση σερβιτόρου";
    case "BILL":
      return "Λογαριασμός";
    case "ORDER":
      return "Παραγγελία";
    default:
      return type;
  }
}

function waitSeconds(from: Date, to: Date = new Date()): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
}

function actorLabel(staffMemberName?: string | null): string {
  return staffMemberName?.trim() || "Ιδιοκτήτης (panel)";
}

function eventDedupeKey(referenceId: string, errorCode: string): string {
  return `${referenceId}:${errorCode}`;
}

/** Audit trail — stored as closed INFO so it does not inflate open tickets. */
function logStaffFlowAudit(input: {
  organizationId: string;
  category: string;
  message: string;
  errorCode: string;
  dedupeKey: string;
  context: Prisma.InputJsonValue;
}): void {
  void recordClientDiagnostic({
    organizationId: input.organizationId,
    severity: "INFO",
    source: "server",
    category: input.category,
    message: input.message,
    errorCode: input.errorCode,
    dedupeKey: input.dedupeKey,
    context: input.context,
    initialStatus: "RESOLVED",
  }).catch((err) => console.error("[menuos-push-diagnostics] audit", err));
}

export function logPushDispatchDiagnostic(input: {
  organizationId: string;
  venueId: string;
  venueName?: string;
  flow: PushFlowKind;
  referenceId: string;
  station?: PassStation;
  location?: string;
  callType?: WaiterCallType;
  result: PushDispatchResult;
}): void {
  const ctx = {
    flow: input.flow,
    referenceId: input.referenceId,
    venueId: input.venueId,
    venueName: input.venueName ?? null,
    station: input.station ? passStationDbToInput(input.station) : null,
    location: input.location ?? null,
    callType: input.callType ?? null,
    push: input.result,
  };

  const flowLabel = input.flow === "pass_signal" ? "πάσου" : "κλήσης σερβιτόρου";
  const loc = input.location ? ` · ${input.location}` : "";
  const pushDedupe = (code: string) => eventDedupeKey(input.referenceId, code);

  if (input.result.skippedReason === "push_disabled") {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "push",
      errorCode: "push_disabled",
      dedupeKey: pushDedupe("push_disabled"),
      message: `Push απενεργοποιημένο — δεν στάλθηκε ειδοποίηση ${flowLabel}${loc}`,
      context: ctx,
    });
    return;
  }

  if (input.result.skippedReason === "no_subscriptions") {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "push",
      errorCode: "push_no_subscribers",
      dedupeKey: pushDedupe("push_no_subscribers"),
      message: `Κανένας σερβιτόρος χωρίς ειδοποιήσεις — δεν στάλθηκε push ${flowLabel}${loc}`,
      context: ctx,
    });
    return;
  }

  if (input.result.skippedReason === "no_targets") {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "push",
      errorCode: "push_no_targets",
      dedupeKey: pushDedupe("push_no_targets"),
      message: `Κανένας κατάλληλος σερβιτόρος — δεν στάλθηκε push ${flowLabel}${loc}`,
      context: ctx,
    });
    return;
  }

  if (input.result.targetCount > 0 && input.result.sent === 0) {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "ERROR",
      source: "server",
      category: "push",
      errorCode: "push_all_failed",
      dedupeKey: pushDedupe("push_all_failed"),
      message: `Αποτυχία push σε όλους (${input.result.failed}/${input.result.targetCount}) — ${flowLabel}${loc}`,
      context: ctx,
    });
    return;
  }

  if (input.result.failed > 0) {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "push",
      errorCode: "push_partial_failed",
      dedupeKey: pushDedupe("push_partial_failed"),
      message: `Μερική αποτυχία push (${input.result.sent}/${input.result.targetCount} OK) — ${flowLabel}${loc}`,
      context: ctx,
    });
    return;
  }

  if (input.result.sent > 0) {
    logStaffFlowAudit({
      organizationId: input.organizationId,
      category: "push",
      errorCode: "push_sent",
      dedupeKey: pushDedupe("push_sent"),
      message: `Push OK (${input.result.sent}/${input.result.targetCount}) — ${flowLabel}${loc}`,
      context: ctx,
    });
  }
}

export function logPassSignalCreated(input: {
  organizationId: string;
  venueId: string;
  signalId: string;
  station: PassStation;
  location: string;
  message?: string | null;
  stationScreenLabel?: string | null;
}): void {
  const station = stationLabel(input.station);
  const detail = input.message?.trim();
  logStaffFlowAudit({
    organizationId: input.organizationId,
    category: "pass_flow",
    errorCode: "pass_created",
    dedupeKey: eventDedupeKey(input.signalId, "pass_created"),
    message: `${station} → σερβιτόρος: ${input.location}${detail ? ` (${detail})` : ""}`,
    context: {
      signalId: input.signalId,
      venueId: input.venueId,
      station: passStationDbToInput(input.station),
      location: input.location,
      message: detail ?? null,
      stationScreenLabel: input.stationScreenLabel ?? null,
    },
  });
}

export function logPassSignalStatusChange(input: {
  organizationId: string;
  venueId: string;
  signalId: string;
  station: PassStation;
  location: string;
  status: "PICKED_UP" | "DELIVERED" | "CANCELED";
  staffMemberName?: string | null;
  readyAt: Date;
}): void {
  const seconds = waitSeconds(input.readyAt);
  const staff = actorLabel(input.staffMemberName);
  const station = stationLabel(input.station);

  if (input.status === "CANCELED") {
    logStaffFlowAudit({
      organizationId: input.organizationId,
      category: "pass_flow",
      errorCode: "pass_canceled",
      dedupeKey: eventDedupeKey(input.signalId, "pass_canceled"),
      message: `${station} ακύρωσε πάσο — ${input.location}`,
      context: {
        signalId: input.signalId,
        venueId: input.venueId,
        location: input.location,
        waitSeconds: seconds,
      },
    });
    return;
  }

  const action =
    input.status === "PICKED_UP" ? "πήρε" : "παρέδωσε";
  const slow =
    seconds >= SLOW_PASS_SECONDS &&
    (input.status === "PICKED_UP" || input.status === "DELIVERED");

  if (slow) {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "pass_flow",
      errorCode: "pass_slow_pickup",
      dedupeKey: eventDedupeKey(input.signalId, "pass_slow_pickup"),
      message: `Αργή απάντηση σερβιτόρου (${seconds}s) — ${input.location} · ${station}`,
      context: {
        signalId: input.signalId,
        venueId: input.venueId,
        staffMemberName: staff,
        waitSeconds: seconds,
        location: input.location,
        station: passStationDbToInput(input.station),
      },
    });
  }

  logStaffFlowAudit({
    organizationId: input.organizationId,
    category: "pass_flow",
    errorCode: input.status === "PICKED_UP" ? "pass_picked_up" : "pass_delivered",
    dedupeKey: eventDedupeKey(input.signalId, input.status === "PICKED_UP" ? "pass_picked_up" : "pass_delivered"),
    message: `${staff} ${action} πάσο από ${station} — ${input.location} (${seconds}s)`,
    context: {
      signalId: input.signalId,
      venueId: input.venueId,
      staffMemberName: staff,
      waitSeconds: seconds,
      location: input.location,
      station: passStationDbToInput(input.station),
    },
  });
}

export function logWaiterCallPush(input: {
  organizationId: string;
  venueId: string;
  callId: string;
  callType: WaiterCallType;
  location: string;
  reason: "new" | "reopened" | "order_updated";
}): void {
  const reasonLabel =
    input.reason === "order_updated"
      ? "Ενημέρωση παραγγελίας"
      : input.reason === "reopened"
        ? "Επανεκκίνηση κλήσης"
        : "Νέα κλήση";
  logStaffFlowAudit({
    organizationId: input.organizationId,
    category: "waiter_flow",
    errorCode: "guest_call_created",
    dedupeKey: eventDedupeKey(input.callId, `guest_call:${input.reason}`),
    message: `Πελάτης → σερβιτόρος: ${waiterCallTypeLabel(input.callType)} · ${input.location} (${reasonLabel})`,
    context: {
      callId: input.callId,
      venueId: input.venueId,
      callType: input.callType,
      location: input.location,
      reason: input.reason,
    },
  });
}

export function logWaiterCallStatusChange(input: {
  organizationId: string;
  venueId: string;
  callId: string;
  callType: WaiterCallType;
  location: string;
  status: "ACKNOWLEDGED" | "COMPLETED";
  staffMemberName?: string | null;
  createdAt: Date;
}): void {
  const seconds = waitSeconds(input.createdAt);
  const staff = actorLabel(input.staffMemberName);
  const typeLabel = waiterCallTypeLabel(input.callType);

  if (
    seconds >= SLOW_WAITER_CALL_SECONDS &&
    (input.status === "ACKNOWLEDGED" || input.status === "COMPLETED")
  ) {
    logServerDiagnostic({
      organizationId: input.organizationId,
      severity: "WARN",
      source: "server",
      category: "waiter_flow",
      errorCode: "waiter_call_slow_ack",
      dedupeKey: eventDedupeKey(input.callId, "waiter_call_slow_ack"),
      message: `Αργή απάντηση σερβιτόρου (${seconds}s) — ${typeLabel} · ${input.location}`,
      context: {
        callId: input.callId,
        venueId: input.venueId,
        staffMemberName: staff,
        waitSeconds: seconds,
        location: input.location,
        callType: input.callType,
      },
    });
  }

  const action = input.status === "ACKNOWLEDGED" ? "απάντησε" : "ολοκλήρωσε";
  logStaffFlowAudit({
    organizationId: input.organizationId,
    category: "waiter_flow",
    errorCode: input.status === "ACKNOWLEDGED" ? "waiter_call_ack" : "waiter_call_done",
    dedupeKey: eventDedupeKey(
      input.callId,
      input.status === "ACKNOWLEDGED" ? "waiter_call_ack" : "waiter_call_done",
    ),
    message: `${staff} ${action} — ${typeLabel} · ${input.location} (${seconds}s)`,
    context: {
      callId: input.callId,
      venueId: input.venueId,
      staffMemberName: staff,
      waitSeconds: seconds,
      location: input.location,
      callType: input.callType,
    },
  });
}

export function logPushDispatchError(input: {
  organizationId: string;
  venueId: string;
  flow: PushFlowKind;
  referenceId: string;
  error: unknown;
}): void {
  const message = input.error instanceof Error ? input.error.message : "Push dispatch failed";
  logServerDiagnostic({
    organizationId: input.organizationId,
    severity: "ERROR",
    source: "server",
    category: "push",
    errorCode: "push_dispatch_error",
    dedupeKey: eventDedupeKey(input.referenceId, "push_dispatch_error"),
    message: `Σφάλμα αποστολής push — ${message.slice(0, 120)}`,
    context: {
      flow: input.flow,
      referenceId: input.referenceId,
      venueId: input.venueId,
    },
  });
}
