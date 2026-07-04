import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import { passStationInputToDb } from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

const SCREEN_TOKEN_FIELDS = {
  kitchen: "kitchenScreenToken",
  bar: "barScreenToken",
  cold: "coldScreenToken",
  dessert: "dessertScreenToken",
} as const;

export async function POST(request: Request, { params }: Params) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
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

  const screen = typeof body === "object" && body && "screen" in body ? body.screen : null;
  if (screen !== "kitchen" && screen !== "bar" && screen !== "cold" && screen !== "dessert") {
    return NextResponse.json({ error: "Μη έγκυρη οθόνη." }, { status: 400 });
  }

  const dbStation = passStationInputToDb(screen);
  const screenToken = randomUUID();

  const primary = await prisma.venueStationScreen.findFirst({
    where: { venueId, station: dbStation },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (primary) {
    await prisma.venueStationScreen.update({
      where: { id: primary.id },
      data: { screenToken },
    });
  }

  const field = SCREEN_TOKEN_FIELDS[screen];
  await prisma.venue.update({
    where: { id: venueId },
    data: { [field]: screenToken },
  });

  return NextResponse.json({
    screen,
    screenToken,
    message: "Ο κωδικός οθόνης άλλαξε. Στείλε το νέο link στο τμήμα.",
  });
}
