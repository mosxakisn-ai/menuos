import type { PassStation } from "@menuos/db";
import { prisma } from "@menuos/db";
import webpush from "web-push";
import { passSignalVisibleToStaffMember, listVenuePosts, waiterCallsVisibleToStaffMember } from "@menuos/shared";
import { configureWebPush, isPushEnabled } from "@/lib/push-config";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";
import {
  loadStaffScreensByStation,
  staffMemberAccessUrlFromScreens,
  type StaffScreensByStation,
} from "@/lib/staff-member-access-url";
import {
  logPushDispatchDiagnostic,
  logPushDispatchError,
  type PushDispatchResult,
  type PushFlowKind,
} from "@/lib/push-diagnostics";

export type PushSubRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
  venueId: string | null;
  staffMemberId: string | null;
};

type StaffMemberPushRow = {
  id: string;
  venueId: string;
  memberToken: string;
  stations: string[];
  zoneId: string | null;
};

function pushUrlForSub(
  venueSlug: string,
  venueStaffToken: string,
  sub: PushSubRow,
  membersById: Map<string, StaffMemberPushRow>,
  posts: ReturnType<typeof listVenuePosts>,
  screensByStation: StaffScreensByStation,
): string {
  if (!sub.staffMemberId && sub.venueId === null) {
    return "/dashboard/waiter";
  }
  if (sub.staffMemberId) {
    const member = membersById.get(sub.staffMemberId);
    if (member) {
      return staffMemberAccessUrlFromScreens({
        venueSlug,
        memberToken: member.memberToken,
        zoneId: member.zoneId,
        stations: member.stations,
        posts,
        screensByStation,
      });
    }
  }
  return buildStaffWaiterUrl(venueSlug, venueStaffToken);
}

function filterSubsForPassSignal(
  subs: PushSubRow[],
  membersById: Map<string, StaffMemberPushRow>,
  venueId: string,
  station: PassStation,
  venueSlug: string,
  venueStaffToken: string,
  posts: ReturnType<typeof listVenuePosts>,
  screensByStation: StaffScreensByStation,
): Array<PushSubRow & { url: string }> {
  return subs
    .filter((sub) => {
      if (sub.staffMemberId) {
        const member = membersById.get(sub.staffMemberId);
        if (!member || member.venueId !== venueId) return false;
        return passSignalVisibleToStaffMember(station, member.stations, posts);
      }
      return sub.venueId === null || sub.venueId === venueId;
    })
    .map((sub) => ({
      ...sub,
      url: pushUrlForSub(venueSlug, venueStaffToken, sub, membersById, posts, screensByStation),
    }));
}

function filterSubsForWaiterCall(
  subs: PushSubRow[],
  membersById: Map<string, StaffMemberPushRow>,
  venueId: string,
  venueSlug: string,
  venueStaffToken: string,
  posts: ReturnType<typeof listVenuePosts>,
  screensByStation: StaffScreensByStation,
): Array<PushSubRow & { url: string }> {
  return subs
    .filter((sub) => {
      if (sub.staffMemberId) {
        const member = membersById.get(sub.staffMemberId);
        if (!member || member.venueId !== venueId) return false;
        return waiterCallsVisibleToStaffMember(member.stations);
      }
      return sub.venueId === null || sub.venueId === venueId;
    })
    .map((sub) => ({
      ...sub,
      url: pushUrlForSub(venueSlug, venueStaffToken, sub, membersById, posts, screensByStation),
    }));
}

async function loadMembersById(staffMemberIds: string[]): Promise<Map<string, StaffMemberPushRow>> {
  if (staffMemberIds.length === 0) return new Map();
  const rows = await prisma.venueStaffMember.findMany({
    where: { id: { in: staffMemberIds } },
    select: { id: true, venueId: true, memberToken: true, stations: true, zoneId: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

export async function sendWebPushPayload(
  organizationId: string,
  payload: string,
  targets: Array<PushSubRow & { url: string }>,
): Promise<PushDispatchResult> {
  const base: PushDispatchResult = {
    totalSubscriptions: targets.length,
    targetCount: targets.length,
    sent: 0,
    failed: 0,
    staleRemoved: 0,
  };
  if (targets.length === 0) {
    return { ...base, targetCount: 0, skippedReason: "no_targets" };
  }
  if (!isPushEnabled() || !configureWebPush()) {
    return { ...base, skippedReason: "push_disabled" };
  }

  const staleEndpoints: string[] = [];

  await Promise.all(
    targets.map(async (sub) => {
      const body = JSON.parse(payload) as { url?: string };
      const personalized = JSON.stringify({ ...body, url: sub.url });
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          personalized,
        );
        base.sent += 1;
      } catch (err) {
        base.failed += 1;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) staleEndpoints.push(sub.endpoint);
        else console.error("[menuos-push] send failed", sub.endpoint.slice(0, 48), err);
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints }, organizationId },
    });
    base.staleRemoved = staleEndpoints.length;
  }

  return base;
}

type PushDispatchMeta = {
  organizationId: string;
  venueId: string;
  venueName?: string;
  flow: PushFlowKind;
  referenceId: string;
  station?: PassStation;
  location?: string;
  callType?: import("@menuos/db").WaiterCallType;
};

async function dispatchPushWithDiagnostics(
  meta: PushDispatchMeta,
  payload: string,
  loadTargets: () => Promise<Array<PushSubRow & { url: string }>>,
  totalSubscriptions: number,
): Promise<PushDispatchResult> {
  try {
    if (totalSubscriptions === 0) {
      const result: PushDispatchResult = {
        totalSubscriptions: 0,
        targetCount: 0,
        sent: 0,
        failed: 0,
        staleRemoved: 0,
        skippedReason: "no_subscriptions",
      };
      logPushDispatchDiagnostic({ ...meta, result });
      return result;
    }

    const targets = await loadTargets();
    const result = await sendWebPushPayload(meta.organizationId, payload, targets);
    logPushDispatchDiagnostic({
      ...meta,
      result: { ...result, totalSubscriptions },
    });
    return result;
  } catch (err) {
    logPushDispatchError({
      organizationId: meta.organizationId,
      venueId: meta.venueId,
      flow: meta.flow,
      referenceId: meta.referenceId,
      error: err,
    });
    throw err;
  }
}

export async function pushPassSignalToStaff(input: {
  organizationId: string;
  venueId: string;
  venue: { slug: string; staffToken: string; name?: string };
  station: PassStation;
  payload: string;
  signalId: string;
  location?: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [{ venueId: null }, { venueId: input.venueId }],
    },
    select: { endpoint: true, p256dh: true, auth: true, venueId: true, staffMemberId: true },
  });

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);
  const opsConfig = await getVenueOperationsConfig(input.venueId);
  const posts = listVenuePosts(opsConfig);
  const screensByStation = await loadStaffScreensByStation(input.venueId);

  await dispatchPushWithDiagnostics(
    {
      organizationId: input.organizationId,
      venueId: input.venueId,
      venueName: input.venue.name,
      flow: "pass_signal",
      referenceId: input.signalId,
      station: input.station,
      location: input.location,
    },
    input.payload,
    async () =>
      filterSubsForPassSignal(
        subscriptions,
        membersById,
        input.venueId,
        input.station,
        input.venue.slug,
        input.venue.staffToken,
        posts,
        screensByStation,
      ),
    subscriptions.length,
  );
}

export async function pushWaiterCallToStaff(input: {
  organizationId: string;
  venueId: string;
  venue: { slug: string; staffToken: string; name?: string };
  payload: string;
  callId: string;
  callType: import("@menuos/db").WaiterCallType;
  location?: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [{ venueId: null }, { venueId: input.venueId }],
    },
    select: { endpoint: true, p256dh: true, auth: true, venueId: true, staffMemberId: true },
  });

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);
  const opsConfig = await getVenueOperationsConfig(input.venueId);
  const posts = listVenuePosts(opsConfig);
  const screensByStation = await loadStaffScreensByStation(input.venueId);

  await dispatchPushWithDiagnostics(
    {
      organizationId: input.organizationId,
      venueId: input.venueId,
      venueName: input.venue.name,
      flow: "waiter_call",
      referenceId: input.callId,
      callType: input.callType,
      location: input.location,
    },
    input.payload,
    async () =>
      filterSubsForWaiterCall(
        subscriptions,
        membersById,
        input.venueId,
        input.venue.slug,
        input.venue.staffToken,
        posts,
        screensByStation,
      ),
    subscriptions.length,
  );
}
