import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import { passStationInputToDb, stationScreenUpdateSchema, zodFirstErrorMessage } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { countStationScreens, syncLegacyVenueToken } from "@/lib/station-screens";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string; screenId: string }> };

async function loadOwnedScreen(venueId: string, screenId: string, organizationId: string) {
  const venue = await getVenueForOrganization(venueId, organizationId);
  if (!venue) return null;
  const screen = await prisma.venueStationScreen.findFirst({
    where: { id: screenId, venueId },
  });
  if (!screen) return null;
  return { venue, screen };
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, screenId } = await params;
  const owned = await loadOwnedScreen(venueId, screenId, auth.session!.organizationId);
  if (!owned) {
    return NextResponse.json({ error: "Η οθόνη δεν βρέθηκε." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = stationScreenUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  const screen = await prisma.venueStationScreen.update({
    where: { id: screenId },
    data: { label: parsed.data.label },
    select: { id: true, label: true, screenToken: true, sortOrder: true },
  });

  return NextResponse.json({ screen, message: "Η οθόνη ενημερώθηκε." });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, screenId } = await params;
  const owned = await loadOwnedScreen(venueId, screenId, auth.session!.organizationId);
  if (!owned) {
    return NextResponse.json({ error: "Η οθόνη δεν βρέθηκε." }, { status: 404 });
  }

  const stationCount = await countStationScreens(venueId, owned.screen.station);
  if (stationCount <= 1) {
    return NextResponse.json(
      { error: "Πρέπει να μείνει τουλάχιστον μία οθόνη ανά τμήμα." },
      { status: 400 },
    );
  }

  await prisma.venueStationScreen.delete({ where: { id: screenId } });
  return NextResponse.json({ message: "Η οθόνη διαγράφηκε." });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { venueId, screenId } = await params;
  const owned = await loadOwnedScreen(venueId, screenId, auth.session!.organizationId);
  if (!owned) {
    return NextResponse.json({ error: "Η οθόνη δεν βρέθηκε." }, { status: 404 });
  }

  let rotate = false;
  try {
    const body = (await request.json()) as { action?: string };
    rotate = body.action === "rotate";
  } catch {
    rotate = false;
  }
  if (!rotate) {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const screenToken = randomUUID();
  const screen = await prisma.venueStationScreen.update({
    where: { id: screenId },
    data: { screenToken },
    select: { id: true, label: true, screenToken: true, sortOrder: true, station: true },
  });

  if (owned.screen.sortOrder === 0) {
    const stationInput = screen.station.toLowerCase() as "kitchen" | "bar" | "cold" | "dessert";
    await syncLegacyVenueToken(venueId, stationInput, screenToken);
  }

  return NextResponse.json({
    screen,
    message: "Ο κωδικός οθόνης άλλαξε. Στείλε το νέο link στο τμήμα.",
  });
}
