import type { PassStationInput, VenuePost } from "@menuos/shared";
import {
  pickStationScreenForStaffAssignment,
  resolveStaffAssignmentToPassInput,
  staffAssignmentLinkKind,
  staffPrimaryAssignment,
} from "@menuos/shared";
import { buildStaffShareUrlAbsolute } from "@/lib/staff-share-url";
import { APP_URL } from "@/lib/config";
import { buildStationScreenUrl } from "@/lib/pass-signal-auth";
import { listStationScreens, stationScreenPath, type StationScreenRow } from "@/lib/station-screens";

export type StaffScreensByStation = Partial<
  Record<PassStationInput, ReadonlyArray<Pick<StationScreenRow, "label" | "screenToken">>>
>;

export type StaffMemberAccessResult =
  | { kind: "url"; url: string; device: "mobile" | "tablet" }
  | { kind: "missing-screen"; station: PassStationInput }
  | { kind: "invalid-assignment" };

const PASS_STATIONS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

export async function loadStaffScreensByStation(venueId: string): Promise<StaffScreensByStation> {
  const entries = await Promise.all(
    PASS_STATIONS.map(async (station) => {
      const screens = await listStationScreens(venueId, station);
      return [station, screens] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export function staffMemberTabletUrlFromScreens(
  venueSlug: string,
  assignment: string,
  posts: VenuePost[],
  screensByStation: StaffScreensByStation,
  staffKey?: string,
): string | null {
  const station = resolveStaffAssignmentToPassInput(assignment, posts);
  if (!station) return null;
  const screens = screensByStation[station] ?? [];
  const picked = pickStationScreenForStaffAssignment(assignment, posts, screens);
  if (!picked) return null;
  return buildStationScreenUrl(stationScreenPath(picked.station), venueSlug, picked.screenToken, {
    allPosts: assignment === "pass-all",
    staffKey,
  });
}

export function resolveStaffMemberAccessLink(input: {
  venueSlug: string;
  memberToken: string;
  zoneId?: string | null;
  stations: string[];
  posts: VenuePost[];
  screensByStation: StaffScreensByStation;
}): StaffMemberAccessResult {
  if (input.stations.length === 0) return { kind: "invalid-assignment" };
  const assignment = staffPrimaryAssignment(input.stations);
  const linkKind = staffAssignmentLinkKind(assignment, input.posts);
  if (linkKind === "invalid") return { kind: "invalid-assignment" };

  const station = resolveStaffAssignmentToPassInput(assignment, input.posts);
  if (station) {
    const screens = input.screensByStation[station] ?? [];
    const picked = pickStationScreenForStaffAssignment(assignment, input.posts, screens);
    if (!picked) return { kind: "missing-screen", station };
    return {
      kind: "url",
      device: "tablet",
      url: buildStationScreenUrl(stationScreenPath(picked.station), input.venueSlug, picked.screenToken, {
        allPosts: assignment === "pass-all",
        staffKey: input.memberToken,
      }),
    };
  }

  return {
    kind: "url",
    device: "mobile",
    url: buildStaffShareUrlAbsolute(APP_URL, input.venueSlug, input.memberToken, input.zoneId),
  };
}

export function staffMemberAccessUrlFromScreens(input: {
  venueSlug: string;
  memberToken: string;
  zoneId?: string | null;
  stations: string[];
  posts: VenuePost[];
  screensByStation: StaffScreensByStation;
}): string {
  const resolved = resolveStaffMemberAccessLink(input);
  if (resolved.kind === "url") return resolved.url;
  return buildStaffShareUrlAbsolute(APP_URL, input.venueSlug, input.memberToken, input.zoneId);
}

export async function resolveStaffMemberTabletRedirectUrl(input: {
  venueId: string;
  venueSlug: string;
  stations: string[];
  posts: VenuePost[];
}): Promise<string | null> {
  const result = await resolvePassStaffAccessResult(input);
  return result.kind === "tablet" ? result.url : null;
}

export type StaffPassStaffAccessResult =
  | { kind: "waiter" }
  | { kind: "invalid-assignment" }
  | { kind: "missing-screen"; station: PassStationInput }
  | { kind: "tablet"; url: string };

export async function resolvePassStaffAccessResult(input: {
  venueId: string;
  venueSlug: string;
  stations: string[];
  posts: VenuePost[];
  memberToken?: string | null;
}): Promise<StaffPassStaffAccessResult> {
  const assignment = staffPrimaryAssignment(input.stations);
  const linkKind = staffAssignmentLinkKind(assignment, input.posts);
  if (linkKind === "waiter") return { kind: "waiter" };
  if (linkKind === "invalid") return { kind: "invalid-assignment" };
  const station = resolveStaffAssignmentToPassInput(assignment, input.posts);
  if (!station) return { kind: "invalid-assignment" };
  const screens = await listStationScreens(input.venueId, station);
  const picked = pickStationScreenForStaffAssignment(assignment, input.posts, screens);
  if (!picked) return { kind: "missing-screen", station };
  return {
    kind: "tablet",
    url: buildStationScreenUrl(stationScreenPath(picked.station), input.venueSlug, picked.screenToken, {
      allPosts: assignment === "pass-all",
      staffKey: input.memberToken ?? undefined,
    }),
  };
}
