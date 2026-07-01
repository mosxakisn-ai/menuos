import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import {
  filterVenueSpotsForScreen,
  passStationInputSchema,
  passStationInputToDb,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueSlug = url.searchParams.get("venueSlug")?.trim();
  const stationKey = url.searchParams.get("key")?.trim();
  const stationRaw = url.searchParams.get("station")?.trim();

  const stationParsed = passStationInputSchema.safeParse(stationRaw);
  if (!venueSlug || !stationKey || !stationParsed.success) {
    return NextResponse.json({ error: "Λάθος παράμετροι." }, { status: 400 });
  }

  const station = stationParsed.data as PassStationInput;
  if (!["kitchen", "bar", "cold", "dessert"].includes(station)) {
    return NextResponse.json({ error: "Μη έγκυρο τμήμα." }, { status: 400 });
  }

  const auth = await authorizePassSignalCreate(request, {
    venueSlug,
    station,
    stationKey,
  });
  if (auth.response) return auth.response;

  const spots = await prisma.venueSpot.findMany({
    where: { venueId: auth.venue.id },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    select: { type: true, label: true },
    take: 200,
  });

  const filtered = filterVenueSpotsForScreen(spots, auth.stationScreen?.spotPrefix);

  const dbStation = passStationInputToDb(station);
  const activeSignals = await prisma.passSignal.findMany({
    where: {
      venueId: auth.venue.id,
      station: dbStation,
      status: { in: ["READY", "PICKED_UP"] },
      ...(auth.stationScreen?.id ? { stationScreenId: auth.stationScreen.id } : {}),
    },
    orderBy: { readyAt: "desc" },
    take: 24,
    select: {
      id: true,
      tableNumber: true,
      roomNumber: true,
      sunbedNumber: true,
      message: true,
      status: true,
      readyAt: true,
    },
  });

  return NextResponse.json({
    venueId: auth.venue.id,
    venueName: auth.venue.name,
    venueSlug: auth.venue.slug,
    station,
    screenLabel: auth.stationScreen?.label ?? null,
    spotPrefix: auth.stationScreen?.spotPrefix ?? null,
    spots: filtered,
    activeSignals,
  });
}
