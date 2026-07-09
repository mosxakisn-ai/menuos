import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { Prisma } from "@menuos/db";
import {
  applyZoneLabelOverrides,
  groupVenueSpotsByZone,
  passSignalLocationMatchesForZone,
  passStationInputToDb,
  type PassStationInput,
} from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { athensDayBounds, isAthensDateInPeriod } from "@/lib/athens-day";
import { getVenueForOrganization } from "@/lib/venue-access";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

const MAX_DAYS = 90;
const DEFAULT_DAYS = 7;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const ALL_LIMIT = 5000;

const STATION_INPUTS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

export async function GET(request: Request) {
  const auth = await requireLive360Plan({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const daysRaw = Number(searchParams.get("days") ?? DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw)
    ? Math.min(MAX_DAYS, Math.max(1, Math.floor(daysRaw)))
    : DEFAULT_DAYS;
  const limitParam = searchParams.get("limit")?.trim();
  const limitAll = limitParam === "all";
  const limitRaw = limitAll ? ALL_LIMIT : Number(limitParam ?? DEFAULT_LIMIT);
  const limit = limitAll
    ? ALL_LIMIT
    : Number.isFinite(limitRaw)
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
      : DEFAULT_LIMIT;
  const limitResponse = limitAll ? ("all" as const) : limit;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dateParam = searchParams.get("date")?.trim();
  let deliveredAtFilter: Prisma.DateTimeFilter = { gte: since };
  if (dateParam) {
    try {
      if (!isAthensDateInPeriod(dateParam, days)) {
        return NextResponse.json({ signals: [], days, limit: limitResponse, date: dateParam });
      }
      const bounds = athensDayBounds(dateParam);
      deliveredAtFilter = { gte: bounds.gte, lt: bounds.lt };
    } catch {
      return NextResponse.json({ error: "Μη έγκυρη ημερομηνία." }, { status: 400 });
    }
  }

  const where: Prisma.PassSignalWhereInput = {
    venueId,
    status: "DELIVERED",
    deliveredAt: deliveredAtFilter,
  };

  const stationParam = searchParams.get("station")?.trim();
  if (stationParam && STATION_INPUTS.includes(stationParam as PassStationInput)) {
    where.station = passStationInputToDb(stationParam as PassStationInput);
  }

  const stationScreenId = searchParams.get("stationScreenId")?.trim();
  if (stationScreenId) {
    const screen = await prisma.venueStationScreen.findFirst({
      where: { id: stationScreenId, venueId },
      select: { id: true, station: true },
    });
    if (!screen) {
      return NextResponse.json({
        signals: [],
        days,
        limit: limitResponse,
        ...(dateParam ? { date: dateParam } : {}),
      });
    }
    const primary = await prisma.venueStationScreen.findFirst({
      where: { venueId, station: screen.station },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (primary?.id === screen.id) {
      where.OR = [{ stationScreenId: screen.id }, { stationScreenId: null, station: screen.station }];
    } else {
      where.stationScreenId = screen.id;
    }
  }

  const staffMemberId = searchParams.get("staffMemberId")?.trim();
  if (staffMemberId) {
    const member = await prisma.venueStaffMember.findFirst({
      where: { id: staffMemberId, venueId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ signals: [], days, limit: limitResponse });
    }
    where.deliveredByStaffMemberId = staffMemberId;
  }

  const zoneId = searchParams.get("zoneId")?.trim();
  if (zoneId) {
    const spots = await prisma.venueSpot.findMany({
      where: { venueId },
      select: { type: true, label: true },
    });
    const opsConfig = await getVenueOperationsConfig(venueId);
    const groups = applyZoneLabelOverrides(groupVenueSpotsByZone(spots), opsConfig.zoneLabels);
    const group = groups.find((row) => row.id === zoneId);
    if (!group) {
      return NextResponse.json({
        signals: [],
        days,
        limit: limitResponse,
        ...(dateParam ? { date: dateParam } : {}),
      });
    }
    const legacyOr: Prisma.PassSignalWhereInput[] = passSignalLocationMatchesForZone(group).map(
      (loc) => ({
        zoneId: null,
        tableNumber: loc.tableNumber,
        roomNumber: loc.roomNumber,
        sunbedNumber: loc.sunbedNumber,
      }),
    );
    const zoneFilter: Prisma.PassSignalWhereInput = {
      OR: [{ zoneId }, ...legacyOr],
    };
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), zoneFilter];
  }

  try {
    const signals = await prisma.passSignal.findMany({
      where,
      orderBy: { deliveredAt: "desc" },
      take: limit,
      include: {
        stationScreen: { select: { label: true } },
        deliveredByStaffMember: { select: { name: true } },
      },
    });

    return NextResponse.json({
      signals: signals.map(({ stationScreen, deliveredByStaffMember, ...signal }) => ({
        ...signal,
        stationScreenLabel: stationScreen?.label ?? null,
        deliveredByStaffMemberName: deliveredByStaffMember?.name ?? null,
      })),
      days,
      limit: limitResponse,
      truncated: signals.length >= limit,
      ...(dateParam ? { date: dateParam } : {}),
    });
  } catch (err) {
    console.error("[menuos] pass-signals history GET failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή.", code: "server_error" },
      { status: 500 },
    );
  }
}
