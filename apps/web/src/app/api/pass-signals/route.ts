import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import {
  normalizeWaiterCallLocation,
  passSignalCreateSchema,
  passStationInputToDb,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { pushStaffPassSignal } from "@/lib/pass-signal-push";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const auth = await requireWaiterVenueAccess(request, venueId);
  if (auth.response) return auth.response;

  try {
    const signals = await prisma.passSignal.findMany({
      where: {
        venueId,
        status: { in: ["READY", "PICKED_UP"] },
      },
      orderBy: { readyAt: "desc" },
      take: 80,
    });

    return NextResponse.json({ signals, activeCount: signals.length });
  } catch (err) {
    console.error("[menuos] pass-signals GET failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή.", code: "server_error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `pass-signal:${ip}:${parsed.data.venueSlug ?? parsed.data.venueId}:${parsed.data.station}`;
  const rateLimit = await checkRateLimitOutcome(rateKey, 30, 60_000);
  if (rateLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (rateLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  const auth = await authorizePassSignalCreate(request, {
    venueId: parsed.data.venueId,
    venueSlug: parsed.data.venueSlug,
    station: parsed.data.station,
    stationKey: parsed.data.stationKey,
  });
  if (auth.response) return auth.response;

  const location = normalizeWaiterCallLocation(parsed.data);
  const message = parsed.data.message?.trim() || null;

  try {
    const signal = await prisma.passSignal.create({
      data: {
        venueId: auth.venue.id,
        station: passStationInputToDb(parsed.data.station),
        tableNumber: location.tableNumber,
        roomNumber: location.roomNumber,
        sunbedNumber: location.sunbedNumber,
        message,
      },
    });

    const venueFull = await prisma.venue.findUnique({
      where: { id: auth.venue.id },
      select: { id: true, name: true, slug: true, staffToken: true, organizationId: true },
    });
    if (venueFull) {
      pushStaffPassSignal(venueFull, signal);
    }

    return NextResponse.json({ signal });
  } catch (err) {
    console.error("[menuos] pass-signals POST failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο.", code: "server_error" },
      { status: 500 },
    );
  }
}
