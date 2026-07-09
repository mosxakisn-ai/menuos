import type { PassStation } from "@menuos/db";
import { prisma } from "@menuos/db";
import { randomUUID } from "crypto";
import {
  DEFAULT_STATION_SCREEN_LABELS_EL,
  isVenuePassPostStation,
  PASS_STATION_INPUTS,
  passStationDbToInput,
  passStationInputToDb,
  spotPrefixForVenuePost,
  staffAssignableVenuePosts,
  type PassStationInput,
  type VenueOperationsConfig,
} from "@menuos/shared";

export type StationScreenRow = {
  id: string;
  label: string;
  screenToken: string;
  sortOrder: number;
  spotPrefix: string | null;
};

const LEGACY_TOKEN_FIELDS: Record<
  PassStationInput,
  "kitchenScreenToken" | "barScreenToken" | "coldScreenToken" | "dessertScreenToken"
> = {
  kitchen: "kitchenScreenToken",
  bar: "barScreenToken",
  cold: "coldScreenToken",
  dessert: "dessertScreenToken",
};

export function stationScreenPath(station: PassStationInput): "/kds" | "/bds" | "/cold" | "/dessert" {
  if (station === "kitchen") return "/kds";
  if (station === "bar") return "/bds";
  if (station === "cold") return "/cold";
  return "/dessert";
}

export async function listStationScreens(
  venueId: string,
  station: PassStationInput,
): Promise<StationScreenRow[]> {
  const dbStation = passStationInputToDb(station);
  return prisma.venueStationScreen.findMany({
    where: { venueId, station: dbStation },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, label: true, screenToken: true, sortOrder: true, spotPrefix: true },
  });
}

/** Kitchen & bar pass tablets — matches Πόστα tab (not legacy cold/dessert). */
export async function listPassStationScreens(
  venueId: string,
): Promise<(StationScreenRow & { station: PassStationInput })[]> {
  const rows = await prisma.venueStationScreen.findMany({
    where: { venueId, station: { in: ["KITCHEN", "BAR"] } },
    orderBy: [{ station: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      label: true,
      screenToken: true,
      sortOrder: true,
      spotPrefix: true,
      station: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    screenToken: row.screenToken,
    sortOrder: row.sortOrder,
    spotPrefix: row.spotPrefix,
    station: passStationDbToInput(row.station),
  }));
}

export async function resolveStationScreenByToken(
  venueId: string,
  station: PassStationInput,
  screenToken: string,
): Promise<{ id: string; label: string; spotPrefix: string | null; quickChips: string[] } | null> {
  const dbStation = passStationInputToDb(station);
  return prisma.venueStationScreen.findFirst({
    where: { venueId, station: dbStation, screenToken },
    select: { id: true, label: true, spotPrefix: true, quickChips: true },
  });
}

export async function resolvePrimaryStationScreen(
  venueId: string,
  station: PassStationInput,
): Promise<{ id: string; label: string; spotPrefix: string | null } | null> {
  const dbStation = passStationInputToDb(station);
  return prisma.venueStationScreen.findFirst({
    where: { venueId, station: dbStation },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, label: true, spotPrefix: true },
  });
}

export function legacyVenueScreenToken(
  venue: {
    kitchenScreenToken: string;
    barScreenToken: string;
    coldScreenToken: string;
    dessertScreenToken: string;
  },
  station: PassStationInput,
): string {
  return venue[LEGACY_TOKEN_FIELDS[station]];
}

export function legacyVenueTokenMatches(
  venue: {
    kitchenScreenToken: string;
    barScreenToken: string;
    coldScreenToken: string;
    dessertScreenToken: string;
  },
  station: PassStationInput,
  screenToken: string,
): boolean {
  return legacyVenueScreenToken(venue, station) === screenToken;
}

export async function syncLegacyVenueToken(
  venueId: string,
  station: PassStationInput,
  screenToken: string,
): Promise<void> {
  const field = LEGACY_TOKEN_FIELDS[station];
  await prisma.venue.update({
    where: { id: venueId },
    data: { [field]: screenToken },
  });
}

export async function nextStationScreenSortOrder(
  venueId: string,
  station: PassStation,
): Promise<number> {
  const last = await prisma.venueStationScreen.findFirst({
    where: { venueId, station },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export function defaultStationScreenLabel(station: PassStationInput, index: number): string {
  const base = DEFAULT_STATION_SCREEN_LABELS_EL[station];
  return index === 0 ? base : `${base} ${index + 1}`;
}

export async function countStationScreens(venueId: string, station: PassStation): Promise<number> {
  return prisma.venueStationScreen.count({ where: { venueId, station } });
}

export async function isStationScreenLabelTaken(
  venueId: string,
  station: PassStationInput,
  label: string,
  excludeScreenId?: string,
): Promise<boolean> {
  const dbStation = passStationInputToDb(station);
  const normalized = label.trim().toLowerCase();
  const rows = await prisma.venueStationScreen.findMany({
    where: {
      venueId,
      station: dbStation,
      ...(excludeScreenId ? { id: { not: excludeScreenId } } : {}),
    },
    select: { label: true },
  });
  return rows.some((row) => row.label.trim().toLowerCase() === normalized);
}

/** One tablet screen per pass post — label + spot filter match Πόστα tab. */
export async function syncStationScreensFromPosts(
  venueId: string,
  config: VenueOperationsConfig,
): Promise<void> {
  const posts = staffAssignableVenuePosts(config, "GR");
  const postsByStation = new Map<PassStationInput, typeof posts>();
  for (const post of posts) {
    if (!isVenuePassPostStation(post.station)) continue;
    const list = postsByStation.get(post.station) ?? [];
    list.push(post);
    postsByStation.set(post.station, list);
  }

  const venueRow = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      kitchenScreenToken: true,
      barScreenToken: true,
      coldScreenToken: true,
      dessertScreenToken: true,
    },
  });
  if (!venueRow) return;

  for (const station of PASS_STATION_INPUTS) {
    const dbStation = passStationInputToDb(station);
    const postsForStation = postsByStation.get(station) ?? [];
    const desiredLabels = new Set(postsForStation.map((post) => post.label.trim()));

    let existing = await prisma.venueStationScreen.findMany({
      where: { venueId, station: dbStation },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    for (const screen of existing) {
      if (!desiredLabels.has(screen.label.trim())) {
        await prisma.venueStationScreen.delete({ where: { id: screen.id } });
      }
    }

    existing = await prisma.venueStationScreen.findMany({
      where: { venueId, station: dbStation },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    for (let index = 0; index < postsForStation.length; index++) {
      const post = postsForStation[index]!;
      const label = post.label.trim();
      const spotPrefix = spotPrefixForVenuePost(post, config.zoneLabels);
      const match = existing.find((row) => row.label.trim() === label);

      if (match) {
        if (match.spotPrefix !== spotPrefix || match.sortOrder !== index) {
          await prisma.venueStationScreen.update({
            where: { id: match.id },
            data: { spotPrefix, sortOrder: index },
          });
        }
        continue;
      }

      const isFirstForStation = existing.length === 0;
      const screenToken = isFirstForStation
        ? legacyVenueScreenToken(venueRow, station)
        : randomUUID();

      const created = await prisma.venueStationScreen.create({
        data: {
          venueId,
          station: dbStation,
          label,
          spotPrefix,
          screenToken,
          sortOrder: index,
        },
      });

      existing = [...existing, created];

      if (isFirstForStation) {
        await syncLegacyVenueToken(venueId, station, screenToken);
      }
    }
  }
}
