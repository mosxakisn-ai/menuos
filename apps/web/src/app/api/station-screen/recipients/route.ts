import { NextResponse } from "next/server";
import type { PassStationInput } from "@menuos/shared";
import { passStationInputSchema } from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { listKdsPassNotifyRecipients } from "@/lib/kds-pass-recipients";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueSlug = url.searchParams.get("venueSlug")?.trim();
  const stationKey = url.searchParams.get("key")?.trim();
  const stationRaw = url.searchParams.get("station")?.trim();
  const passStationRaw = url.searchParams.get("passStation")?.trim() ?? stationRaw;
  const zoneId = url.searchParams.get("zoneId")?.trim() || null;

  const stationParsed = passStationInputSchema.safeParse(stationRaw);
  const passStationParsed = passStationInputSchema.safeParse(passStationRaw);
  if (!venueSlug || !stationKey || !stationParsed.success || !passStationParsed.success) {
    return NextResponse.json({ error: "Λάθος παράμετροι." }, { status: 400 });
  }

  const station = stationParsed.data as PassStationInput;
  const passStation = passStationParsed.data as PassStationInput;

  const auth = await authorizePassSignalCreate(request, {
    venueSlug,
    station,
    stationKey,
  });
  if (auth.response) return auth.response;

  const { recipients, zoneLabel } = await listKdsPassNotifyRecipients({
    venueId: auth.venue.id,
    passStation,
    targetZoneId: zoneId,
  });

  return NextResponse.json({ recipients, zoneLabel });
}
