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
  staffMemberId: string | null;
};

type StaffMemberPushRow = {
  id: string;
  memberToken: string;
  stations: string[];
};

function pushUrlForSub(
  venueSlug: string,
  venueStaffToken: string,
  staffMemberId: string | null,
  membersById: Map<string, StaffMemberPushRow>,
): string {
  if (staffMemberId) {
    const member = membersById.get(staffMemberId);
    if (member) return buildStaffWaiterUrl(venueSlug, member.memberToken);
  }
  return buildStaffWaiterUrl(venueSlug, venueStaffToken);
}

function filterSubsForPassSignal(
  subs: PushSubRow[],
  membersById: Map<string, StaffMemberPushRow>,
  station: PassStation,
  venueSlug: string,
  venueStaffToken: string,
): Array<PushSubRow & { url: string }> {
  return subs
    .filter((sub) => {
      if (!sub.staffMemberId) return true;
      const member = membersById.get(sub.staffMemberId);
      if (!member) return false;
      return passSignalVisibleToStaffMember(station, member.stations);
    })
    .map((sub) => ({
      ...sub,
      url: pushUrlForSub(venueSlug, venueStaffToken, sub.staffMemberId, membersById),
    }));
}

function filterSubsForWaiterCall(
  subs: PushSubRow[],
  membersById: Map<string, StaffMemberPushRow>,
  venueSlug: string,
  venueStaffToken: string,
): Array<PushSubRow & { url: string }> {
  return subs
    .filter((sub) => {
      if (!sub.staffMemberId) return true;
      const member = membersById.get(sub.staffMemberId);
      if (!member) return false;
      return waiterCallsVisibleToStaffMember(member.stations);
    })
    .map((sub) => ({
      ...sub,
      url: pushUrlForSub(venueSlug, venueStaffToken, sub.staffMemberId, membersById),
    }));
}

async function loadMembersById(staffMemberIds: string[]): Promise<Map<string, StaffMemberPushRow>> {
  if (staffMemberIds.length === 0) return new Map();
  const rows = await prisma.venueStaffMember.findMany({
    where: { id: { in: staffMemberIds } },
    select: { id: true, memberToken: true, stations: true },
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
  venue: { slug: string; staffToken: string };
  station: PassStation;
  payload: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { organizationId: input.organizationId },
    select: { endpoint: true, p256dh: true, auth: true, staffMemberId: true },
  });
  if (subscriptions.length === 0) return;

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);

  const targets = filterSubsForPassSignal(
    subscriptions,
    membersById,
    input.station,
    input.venue.slug,
    input.venue.staffToken,
  );
  await sendWebPushPayload(input.organizationId, input.payload, targets);
}

export async function pushWaiterCallToStaff(input: {
  organizationId: string;
  venue: { slug: string; staffToken: string };
  payload: string;
}): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { organizationId: input.organizationId },
    select: { endpoint: true, p256dh: true, auth: true, staffMemberId: true },
  });
  if (subscriptions.length === 0) return;

  const memberIds = subscriptions
    .map((s) => s.staffMemberId)
    .filter((id): id is string => Boolean(id));
  const membersById = await loadMembersById([...new Set(memberIds)]);

  const targets = filterSubsForWaiterCall(
    subscriptions,
    membersById,
    input.venue.slug,
    input.venue.staffToken,
  );
  await sendWebPushPayload(input.organizationId, input.payload, targets);
}
