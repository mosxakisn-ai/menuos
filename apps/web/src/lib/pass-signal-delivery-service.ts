import { prisma } from "@menuos/db";
import type { PassSignal, PassStation } from "@menuos/db";
import {
  PASS_SIGNAL_MAX_REPUSH,
  PASS_SIGNAL_REPUSH_COOLDOWN_SECONDS,
  PASS_SIGNAL_UNSEEN_REPUSH_SECONDS,
} from "@menuos/shared";
import type { PushDispatchResult } from "@/lib/push-diagnostics";
import { pushPassSignalToStaff } from "@/lib/staff-push-dispatch";
import {
  buildPassSignalAnnouncement,
  buildPassSignalPushCopy,
  applyZoneLabelOverrides,
  groupVenueSpotsByZone,
} from "@menuos/shared";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { getOrganizationNotificationSettings } from "@/lib/organization-notification-settings";

function pushStatsFromResult(result: PushDispatchResult) {
  return {
    pushSentAt: new Date(),
    pushTargetCount: result.targetCount,
    pushSentCount: result.sent,
    pushFailedCount: result.failed,
  };
}

export async function persistPassSignalPushStats(
  signalId: string,
  result: PushDispatchResult,
  opts?: { preserveOnFailedRepush?: boolean },
): Promise<void> {
  if (result.skippedReason === "push_disabled") return;

  if (
    opts?.preserveOnFailedRepush &&
    result.sent === 0 &&
    (result.failed > 0 || result.skippedReason === "no_targets")
  ) {
    const current = await prisma.passSignal.findUnique({
      where: { id: signalId },
      select: { pushSentCount: true },
    });
    if ((current?.pushSentCount ?? 0) > 0) return;
  }

  await prisma.passSignal.update({
    where: { id: signalId },
    data: pushStatsFromResult(result),
  });
}

export async function markPassSignalSeen(
  signalId: string,
  venueId: string,
  staffMemberId: string,
): Promise<boolean> {
  const now = new Date();
  const updated = await prisma.passSignal.updateMany({
    where: {
      id: signalId,
      venueId,
      status: "READY",
      firstSeenAt: null,
    },
    data: {
      firstSeenAt: now,
      seenByStaffMemberId: staffMemberId,
    },
  });
  return updated.count > 0;
}

type PassSignalPushRow = Pick<
  PassSignal,
  | "id"
  | "station"
  | "tableNumber"
  | "roomNumber"
  | "sunbedNumber"
  | "zoneId"
  | "message"
> & { repushCount?: number; notifyStaffMemberIds?: string[] };

function resolveNotifyTargets(
  notifyStaffMemberIds: string[] | null | undefined,
): string[] | undefined {
  const ids = notifyStaffMemberIds?.filter((id) => id.trim().length > 0) ?? [];
  return ids.length > 0 ? ids : undefined;
}

async function dispatchPassSignalPush(
  venue: { id: string; name: string; slug: string; staffToken: string; organizationId: string },
  signal: PassSignalPushRow,
  opts?: { notifyStaffMemberIds?: string[] },
): Promise<PushDispatchResult> {
  const opsConfig = await getVenueOperationsConfig(venue.id);
  const spots = await prisma.venueSpot.findMany({
    where: { venueId: venue.id },
    select: { type: true, label: true },
    orderBy: { sortOrder: "asc" },
  });
  const zoneGroups = applyZoneLabelOverrides(groupVenueSpotsByZone(spots), opsConfig.zoneLabels);
  const activeZoneId = signal.zoneId ?? null;
  const { title, body } = buildPassSignalPushCopy(signal, { zoneGroups, activeZoneId });
  const orgNotifications = await getOrganizationNotificationSettings(venue.organizationId);
  const voiceEnabled = orgNotifications.voiceMessagesEnabled;
  const announcement = voiceEnabled
    ? buildPassSignalAnnouncement(signal, { zoneGroups, activeZoneId })
    : undefined;
  const payload = JSON.stringify({
    title,
    body,
    url: buildStaffWaiterUrl(venue.slug, venue.staffToken),
    tag: `pass-${signal.id}`,
    voiceEnabled,
    announcement: announcement?.trim() || undefined,
    zoneId: activeZoneId ?? undefined,
    passId: signal.id,
  });

  const notifyStaffMemberIds =
    opts?.notifyStaffMemberIds ?? resolveNotifyTargets(signal.notifyStaffMemberIds);

  return pushPassSignalToStaff({
    organizationId: venue.organizationId,
    venueId: venue.id,
    venue: { slug: venue.slug, staffToken: venue.staffToken, name: venue.name },
    station: signal.station as PassStation,
    payload,
    signalId: signal.id,
    location: body,
    notifyStaffMemberIds,
  });
}

export async function repushPassSignal(
  signal: PassSignalPushRow & { venueId: string },
): Promise<void> {
  const venue = await prisma.venue.findUnique({
    where: { id: signal.venueId },
    select: { id: true, name: true, slug: true, staffToken: true, organizationId: true },
  });
  if (!venue) return;

  const expectedRepush = signal.repushCount ?? 0;
  const stillEligible = await prisma.passSignal.findFirst({
    where: {
      id: signal.id,
      status: "READY",
      firstSeenAt: null,
      repushCount: expectedRepush,
    },
    select: { id: true },
  });
  if (!stillEligible) return;

  let result: PushDispatchResult;
  try {
    result = await dispatchPassSignalPush(venue, signal);
  } catch (err) {
    console.error("[menuos] pass-signal repush dispatch failed", signal.id, err);
    return;
  }

  const claimed = await prisma.passSignal.updateMany({
    where: {
      id: signal.id,
      status: "READY",
      firstSeenAt: null,
      repushCount: expectedRepush,
    },
    data: {
      repushCount: { increment: 1 },
      lastRepushAt: new Date(),
    },
  });
  if (claimed.count === 0) return;

  await persistPassSignalPushStats(signal.id, result, { preserveOnFailedRepush: true });
}

/** Re-push unseen pass signals that have been waiting too long (best-effort, idempotent). */
export async function maybeRepushStalePassSignals(venueId: string, now = new Date()): Promise<void> {
  const staleCutoff = new Date(now.getTime() - PASS_SIGNAL_UNSEEN_REPUSH_SECONDS * 1000);
  const cooldownCutoff = new Date(now.getTime() - PASS_SIGNAL_REPUSH_COOLDOWN_SECONDS * 1000);

  const stale = await prisma.passSignal.findMany({
    where: {
      venueId,
      status: "READY",
      firstSeenAt: null,
      readyAt: { lt: staleCutoff },
      repushCount: { lt: PASS_SIGNAL_MAX_REPUSH },
      OR: [{ lastRepushAt: null }, { lastRepushAt: { lt: cooldownCutoff } }],
    },
    orderBy: { readyAt: "asc" },
    take: 6,
    select: {
      id: true,
      venueId: true,
      station: true,
      tableNumber: true,
      roomNumber: true,
      sunbedNumber: true,
      zoneId: true,
      message: true,
      repushCount: true,
      notifyStaffMemberIds: true,
    },
  });

  for (const signal of stale) {
    try {
      await repushPassSignal(signal);
    } catch (err) {
      console.error("[menuos] pass-signal repush failed", signal.id, err);
    }
  }
}

export { dispatchPassSignalPush };
