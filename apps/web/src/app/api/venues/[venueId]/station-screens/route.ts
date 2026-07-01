import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import {
  passStationInputSchema,
  passStationInputToDb,
  STATION_SCREENS_MAX_PER_STATION,
  stationScreenCreateSchema,
  zodFirstErrorMessage,
} from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { countStationScreens, isStationScreenLabelTaken, listStationScreens, nextStationScreenSortOrder } from "@/lib/station-screens";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const existing = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const stationRaw = new URL(request.url).searchParams.get("station");
  const stationParsed = passStationInputSchema.safeParse(stationRaw);
  if (!stationParsed.success) {
    return NextResponse.json({ error: "Μη έγκυρο τμήμα." }, { status: 400 });
  }

  const screens = await listStationScreens(venueId, stationParsed.data);
  return NextResponse.json({ screens });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const existing = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = stationScreenCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  const dbStation = passStationInputToDb(parsed.data.station);
  const count = await countStationScreens(venueId, dbStation);
  if (count >= STATION_SCREENS_MAX_PER_STATION) {
    return NextResponse.json(
      { error: `Μέγιστο ${STATION_SCREENS_MAX_PER_STATION} οθόνες ανά τμήμα.` },
      { status: 400 },
    );
  }

  if (await isStationScreenLabelTaken(venueId, parsed.data.station, parsed.data.label)) {
    return NextResponse.json({ error: "Υπάρχει ήδη οθόνη με αυτό το όνομα." }, { status: 400 });
  }

  const sortOrder = await nextStationScreenSortOrder(venueId, dbStation);
  const screen = await prisma.venueStationScreen.create({
    data: {
      venueId,
      station: dbStation,
      label: parsed.data.label,
      screenToken: randomUUID(),
      sortOrder,
    },
    select: { id: true, label: true, screenToken: true, sortOrder: true },
  });

  return NextResponse.json({ screen, message: "Η οθόνη προστέθηκε." });
}
