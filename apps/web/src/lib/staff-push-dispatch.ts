import type { PassStation } from "@menuos/db";
import { prisma } from "@menuos/db";
import webpush from "web-push";
import { passSignalVisibleToStaffMember, waiterCallsVisibleToStaffMember } from "@menuos/shared";
import { configureWebPush, isPushEnabled } from "@/lib/push-config";
import { buildStaffWaiterUrl } from "@/lib/staff-auth";

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
};

function pushUrlForSub(
  venueSlug: string,
  venueStaffToken: string,
  sub: PushSubRow,
  membersById: Map<string, StaffMemberPushRow>,
): string {
  if (!sub.staffMemberId && sub.venueId === null) {
    return "/dashboard/waiter";
  }
  if (sub.staffMemberId) {
    const member = membersById.get(sub.staffMemberId);
    if (member) return buildStaffWaiterUrl(venueSlug, member.memberToken);
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
): Array<PushSubRow & { url: string }> {
  return subs
    .filter((sub) => {
      if (sub.staffMemberId) {
        const member = membersById.get(sub.staffMemberId);
        if (!member || member.venueId !== venueId) return false;
        return passSignalVisibleToStaffMember(station, member.stations);
      }
      return sub.venueId === null || sub.venueId === venueId;
    })
    .map((sub) => ({
      ...sub,
      url: pushUrlForSub(venueSlug, venueStaffToken, sub, membersById),
    }));
}

function filterSubsForWaiterCall(
  subs: PushSubRow[],
  membersById: Map<string, StaffMemberPushRow>,
  venueId: string,
  venueSlug: string,
  venueStaffToken: string,
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
      url: pushUrlForSub(venueSlug, venueStaffToken, sub, membersById),
    }));
}

async function loadMembersById(staffMemberIds: string[]): Promise<Map<string, StaffMemberPushRow>> {
  if (staffMemberIds.length === 0) return new Map();
  const rows = await prisma.venueStaffMember.findMany({
    where: { id: { in: staffMemberIds } },
    select: { id: true, venueId: true, memberToken: true, stations: true },
  });
  return new Map(rows.map((row) => [row.id, row]));
}

export async function sendWebPushPayload(
  organizationId: string,
  payload: string,
  targets: Array<PushSubRow & { url: string }>,
): Promise<void> {
  if (targets.length === 0) return;
  if (!isPushEnabled() || !configureWebPush()) return;

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
      } catch (err) {
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
  }
}

export async function pushPassSignalToStaff(input: {
  organizationId: string;
  venueId: string;
  venue: { slug: string; staffToken: string };
  station: PassStation;
  payload: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [{ venueId: null }, { venueId: input.venueId }],
    },
    select: { endpoint: true, p256dh: true, auth: true, venueId: true, staffMemberId: true },
  });
  if (subscriptions.length === 0) return;

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);

  const targets = filterSubsForPassSignal(
    subscriptions,
    membersById,
    input.venueId,
    input.station,
    input.venue.slug,
    input.venue.staffToken,
  );
  await sendWebPushPayload(input.organizationId, input.payload, targets);
}

export async function pushWaiterCallToStaff(input: {
  organizationId: string;
  venueId: string;
  venue: { slug: string; staffToken: string };
  payload: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [{ venueId: null }, { venueId: input.venueId }],
    },
    select: { endpoint: true, p256dh: true, auth: true, venueId: true, staffMemberId: true },
  });
  if (subscriptions.length === 0) return;

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);

  const targets = filterSubsForWaiterCall(
    subscriptions,
    membersById,
    input.venueId,
    input.venue.slug,
    input.venue.staffToken,
  );
  await sendWebPushPayload(input.organizationId, input.payload, targets);
}
