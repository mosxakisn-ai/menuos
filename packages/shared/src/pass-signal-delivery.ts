/** Seconds without seen ack before KDS shows warning styling. */
export const PASS_SIGNAL_STALE_WARNING_SECONDS = 60;

/** Seconds without seen ack before server may re-push to waiters. */
export const PASS_SIGNAL_UNSEEN_REPUSH_SECONDS = 90;

/** Minimum gap between automatic re-pushes for the same signal. */
export const PASS_SIGNAL_REPUSH_COOLDOWN_SECONDS = 60;

/** Max automatic re-pushes per active signal. */
export const PASS_SIGNAL_MAX_REPUSH = 2;

export type PassSignalDeliveryTone = "ok" | "seen" | "warn" | "danger" | "picked";

export type PassSignalDeliveryView = {
  status: "READY" | "PICKED_UP";
  readyAt: string;
  firstSeenAt?: string | null;
  pickedUpAt?: string | null;
  seenByStaffMemberName?: string | null;
  pickedUpByStaffMemberName?: string | null;
  pushTargetCount?: number | null;
  pushSentCount?: number | null;
  pushFailedCount?: number | null;
  repushCount?: number | null;
};

export type PassSignalDeliveryStatus = {
  label: string;
  tone: PassSignalDeliveryTone;
};

function ageSeconds(iso: string, nowMs = Date.now()): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((nowMs - t) / 1000));
}

function pushDeliveryLabel(
  sent: number | null | undefined,
  target: number | null | undefined,
  failed: number | null | undefined,
): string | null {
  if (target == null && sent == null) return null;
  const t = target ?? 0;
  const s = sent ?? 0;
  const f = failed ?? 0;
  if (t === 0) return "Χωρίς push";
  if (s === 0 && f > 0) return "Δεν παραδόθηκε";
  if (f > 0) return `Στάλθηκε ${s}/${t}`;
  return `Στάλθηκε ${s}/${t}`;
}

/** Human KDS status line for an active pass signal. */
export function kdsPassDeliveryStatus(
  signal: PassSignalDeliveryView,
  nowMs = Date.now(),
): PassSignalDeliveryStatus {
  const repushSuffix =
    (signal.repushCount ?? 0) > 0 ? ` · επανάληψη ×${signal.repushCount}` : "";

  if (signal.status === "PICKED_UP") {
    const who = signal.pickedUpByStaffMemberName?.trim() || signal.seenByStaffMemberName?.trim();
    const label = who ? `Αναγνωρίστηκε · ${who}` : "Αναγνωρίστηκε";
    return { label: label + repushSuffix, tone: "picked" };
  }

  if (signal.firstSeenAt) {
    const who = signal.seenByStaffMemberName?.trim();
    const label = who ? `Εμφανίστηκε · ${who}` : "Εμφανίστηκε";
    return { label: label + repushSuffix, tone: "seen" };
  }

  const pushLabel = pushDeliveryLabel(
    signal.pushSentCount,
    signal.pushTargetCount,
    signal.pushFailedCount,
  );
  const age = ageSeconds(signal.readyAt, nowMs);

  if (pushLabel === "Δεν παραδόθηκε" || pushLabel === "Χωρίς push") {
    return { label: pushLabel + repushSuffix, tone: "danger" };
  }

  if (age >= PASS_SIGNAL_STALE_WARNING_SECONDS) {
    const base = pushLabel ? `${pushLabel} · δεν απαντήθηκε` : "Δεν απαντήθηκε";
    return { label: base + repushSuffix, tone: "danger" };
  }

  if ((signal.pushFailedCount ?? 0) > 0 || (signal.repushCount ?? 0) > 0) {
    const base = pushLabel ?? "Στάλθηκε";
    return { label: base + repushSuffix, tone: "warn" };
  }

  return { label: (pushLabel ?? "Στάλθηκε") + repushSuffix, tone: "ok" };
}
