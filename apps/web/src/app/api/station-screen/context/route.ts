import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import {
  enabledPassPostsForStation,
  enabledVenuePosts,
  filterVenueSpotsForScreen,
  getPostMessageColor,
  isPrimaryStationScreen,
  passLocationMatchesScreenSpotPrefix,
  passSignalStationScreenWhere,
  passStationInputSchema,
  passStationInputToDb,
  quickChipsForPost,
  quickChipsForStation,
  resolvePostIdForStationScreen,
  stationDisplayLabel,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { expireStaleActivePassSignals } from "@/lib/pass-signal-cleanup";
import { resolvePrimaryStationScreen } from "@/lib/station-screens";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";
import { startOfTodayAthens } from "@/lib/athens-day";

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

  await expireStaleActivePassSignals({ venueId: auth.venue.id });

  const opsConfig = await getVenueOperationsConfig(auth.venue.id);
  if (!opsConfig.enabledStations.includes(station)) {
    return NextResponse.json({ error: "Το τμήμα δεν είναι ενεργό για αυτό το κατάστημα." }, { status: 403 });
  }

  const spots = await prisma.venueSpot.findMany({
    where: { venueId: auth.venue.id },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    select: { type: true, label: true },
    take: 200,
  });

  const enabledPosts = enabledVenuePosts(opsConfig, "GR");
  const stationPostsRaw = enabledPassPostsForStation(opsConfig, station, "GR");
  const useAllSpots =
    stationPostsRaw.length > 1 || stationPostsRaw.some((post) => !post.zoneId?.trim());
  const filtered = useAllSpots
    ? spots
    : filterVenueSpotsForScreen(spots, auth.stationScreen?.spotPrefix);

  const primaryScreen = await resolvePrimaryStationScreen(auth.venue.id, station);
  const isPrimary = isPrimaryStationScreen(auth.stationScreen?.id, primaryScreen?.id);
  const screenFilter = passSignalStationScreenWhere({
    stationScreenId: auth.stationScreen?.id,
    isPrimaryScreen: isPrimary,
  });

  const dbStation = passStationInputToDb(station);
  const activeSignalsRaw = await prisma.passSignal.findMany({
    where: {
      venueId: auth.venue.id,
      station: dbStation,
      status: { in: ["READY", "PICKED_UP"] },
      ...screenFilter,
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

  const spotPrefixForSignals = useAllSpots ? null : auth.stationScreen?.spotPrefix;

  const activeSignals = activeSignalsRaw.filter((signal) =>
    passLocationMatchesScreenSpotPrefix(
      {
        tableNumber: signal.tableNumber ?? undefined,
        roomNumber: signal.roomNumber ?? undefined,
        sunbedNumber: signal.sunbedNumber ?? undefined,
      },
      spotPrefixForSignals,
    ),
  );
  const todayStart = startOfTodayAthens();
  const todaySignalsRaw = await prisma.passSignal.findMany({
    where: {
      venueId: auth.venue.id,
      station: dbStation,
      readyAt: { gte: todayStart },
      ...screenFilter,
    },
    select: {
      tableNumber: true,
      roomNumber: true,
      sunbedNumber: true,
    },
    take: 500,
  });
  const todayCount = todaySignalsRaw.filter((signal) =>
    passLocationMatchesScreenSpotPrefix(
      {
        tableNumber: signal.tableNumber ?? undefined,
        roomNumber: signal.roomNumber ?? undefined,
        sunbedNumber: signal.sunbedNumber ?? undefined,
      },
      spotPrefixForSignals,
    ),
  ).length;

  const postId = resolvePostIdForStationScreen(
    opsConfig,
    station,
    auth.stationScreen?.label,
    "GR",
  );
  const postIndex = postId ? enabledPosts.findIndex((post) => post.id === postId) : 0;
  const colorPostId = postId ?? enabledPosts[0]?.id ?? "";
  const messageColor = colorPostId
    ? getPostMessageColor(opsConfig, colorPostId, postIndex >= 0 ? postIndex : 0)
    : null;
  const quickComments = quickChipsForStation(opsConfig, station, {
    screenLabel: auth.stationScreen?.label,
    postId,
    lang: "GR",
  });

  const stationPosts = stationPostsRaw.map((post) => {
    const index = enabledPosts.findIndex((row) => row.id === post.id);
    return {
      id: post.id,
      label: post.label.trim(),
      zoneId: post.zoneId ?? null,
      quickComments: quickChipsForPost(opsConfig, post.id, "GR"),
      messageColor: getPostMessageColor(opsConfig, post.id, index >= 0 ? index : 0),
    };
  });

  return NextResponse.json({
    venueId: auth.venue.id,
    venueName: auth.venue.name,
    venueSlug: auth.venue.slug,
    station,
    stationLabel: stationDisplayLabel(opsConfig, station),
    screenLabel: auth.stationScreen?.label ?? null,
    spotPrefix: auth.stationScreen?.spotPrefix ?? null,
    quickComments,
    messageColor,
    stationPosts,
    spots: filtered,
    activeSignals,
    todayCount,
  });
}
