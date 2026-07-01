import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ venueId: string }> };

const SCREEN_TOKEN_FIELDS = {
  kitchen: "kitchenScreenToken",
  bar: "barScreenToken",
  cold: "coldScreenToken",
  dessert: "dessertScreenToken",
} as const;

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

  const screen = typeof body === "object" && body && "screen" in body ? body.screen : null;
  if (screen !== "kitchen" && screen !== "bar" && screen !== "cold" && screen !== "dessert") {
    return NextResponse.json({ error: "Μη έγκυρη οθόνη." }, { status: 400 });
  }

  const field = SCREEN_TOKEN_FIELDS[screen];
  const screenToken = randomUUID();

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
