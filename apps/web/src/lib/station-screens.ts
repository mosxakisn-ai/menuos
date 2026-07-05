import type { PassStation } from "@menuos/db";
import { prisma } from "@menuos/db";
import {
  DEFAULT_STATION_SCREEN_LABELS_EL,
  passStationInputToDb,
  type PassStationInput,
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
