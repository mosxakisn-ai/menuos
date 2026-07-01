import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import { passStationInputSchema } from "@menuos/shared";
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
  if (station !== "kitchen" && station !== "bar") {
    return NextResponse.json({ error: "Μη έγκυρο τμήμα." }, { status: 400 });
  }

  const auth = await authorizePassSignalCreate(request, {
    venueSlug,
    station,
    stationKey,
  });
  if (auth.response) return auth.response;

  const spots = await prisma.venueSpot.findMany({
    where: { venueId: auth.venue.id, type: "TABLE" },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { label: true },
    take: 200,
  });

  return NextResponse.json({
    venueId: auth.venue.id,
    venueName: auth.venue.name,
    venueSlug: auth.venue.slug,
    station,
    spots: spots.map((s) => s.label),
  });
}
