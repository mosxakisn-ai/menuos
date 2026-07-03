import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import {
  formatWaiterCallLocation,
  normalizeWaiterCallLocation,
  passLocationMatchesScreenSpotPrefix,
  passSignalCreateSchema,
  passDbStationsForStaffMember,
  passSignalVisibleToStaffMember,
  passStationInputToDb,
  listVenuePosts,
  stationDisplayLabel,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { pushStaffPassSignal } from "@/lib/pass-signal-push";
import { logPassSignalCreated } from "@/lib/push-diagnostics";
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
    const member = auth.access.staffMember;
    const opsConfig = await getVenueOperationsConfig(venueId);
    const venueEnabledStations = opsConfig.enabledStations.map(passStationInputToDb);
    const posts = listVenuePosts(opsConfig);
    const allowedStations = member ? passDbStationsForStaffMember(member.stations, posts) : null;

    if (member && allowedStations !== null && allowedStations.length === 0) {
      return NextResponse.json({
        signals: [],
        activeCount: 0,
        staffMember: { id: member.id, name: member.name },
      });
    }

    const stationFilter =
      allowedStations === null
        ? venueEnabledStations
        : allowedStations.filter((s) =>
            venueEnabledStations.includes(s as (typeof venueEnabledStations)[number]),
          );

    if (stationFilter.length === 0) {
      return NextResponse.json({
        signals: [],
        activeCount: 0,
        staffMember: member ? { id: member.id, name: member.name } : null,
      });
    }

    const signalsRaw = await prisma.passSignal.findMany({
      where: {
        venueId,
        status: { in: ["READY", "PICKED_UP"] },
        station: { in: stationFilter as ("KITCHEN" | "BAR" | "COLD" | "DESSERT")[] },
      },
      orderBy: { readyAt: "desc" },
      take: 80,
      include: {
        stationScreen: { select: { label: true } },
      },
    });

    const signals = member
      ? signalsRaw.filter((signal) =>
          passSignalVisibleToStaffMember(signal.station, member.stations, posts),
        )
      : signalsRaw;

    return NextResponse.json({
      signals: signals.map(({ stationScreen, ...signal }) => ({
        ...signal,
        stationScreenLabel: stationScreen?.label ?? null,
      })),
      activeCount: signals.length,
      staffMember: member ? { id: member.id, name: member.name } : null,
    });
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

  const opsConfig = await getVenueOperationsConfig(auth.venue.id);
  if (!opsConfig.enabledStations.includes(parsed.data.station)) {
    return NextResponse.json(
      { error: "Το τμήμα δεν είναι ενεργό για αυτό το κατάστημα.", code: "station_disabled" },
      { status: 403 },
    );
  }

  const location = normalizeWaiterCallLocation(parsed.data);
  const message = parsed.data.message?.trim() || null;

  const screenPrefix = auth.stationScreen?.spotPrefix;
  if (
    screenPrefix &&
    !passLocationMatchesScreenSpotPrefix(location, screenPrefix)
  ) {
    return NextResponse.json(
      { error: "Το τραπέζι δεν ανήκει στη ζώνη αυτής της οθόνης.", code: "spot_out_of_zone" },
      { status: 400 },
    );
  }

  try {
    const signal = await prisma.passSignal.create({
      data: {
        venueId: auth.venue.id,
        station: passStationInputToDb(parsed.data.station),
        stationScreenId: auth.stationScreen?.id ?? null,
        tableNumber: location.tableNumber,
        roomNumber: location.roomNumber,
        sunbedNumber: location.sunbedNumber,
        message,
      },
      include: {
        stationScreen: { select: { label: true } },
      },
    });

    const venueFull = await prisma.venue.findUnique({
      where: { id: auth.venue.id },
      select: { id: true, name: true, slug: true, staffToken: true, organizationId: true },
    });
    if (venueFull) {
      const locLabel = formatWaiterCallLocation(signal);
      logPassSignalCreated({
        organizationId: venueFull.organizationId,
        venueId: venueFull.id,
        signalId: signal.id,
        station: signal.station,
        location: locLabel,
        message: signal.message,
        stationScreenLabel: signal.stationScreen?.label ?? null,
        stationDisplayName: stationDisplayLabel(opsConfig, parsed.data.station),
      });
      pushStaffPassSignal(venueFull, signal);
    }

    return NextResponse.json({
      signal: {
        ...signal,
        stationScreenLabel: signal.stationScreen?.label ?? null,
        stationScreen: undefined,
      },
    });
  } catch (err) {
    console.error("[menuos] pass-signals POST failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο.", code: "server_error" },
      { status: 500 },
    );
  }
}
