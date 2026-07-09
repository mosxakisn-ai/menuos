import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import {
  formatWaiterCallLocation,
  passSignalBulkDismissSchema,
  passSignalsEligibleForManualClear,
  passStationDbToInput,
  stationDisplayLabel,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { logPassSignalStatusChange } from "@/lib/push-diagnostics";
import { resolvePrimaryStationScreen } from "@/lib/station-screens";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalBulkDismissSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const auth = await authorizePassSignalCreate(request, {
    venueSlug: parsed.data.venueSlug,
    station: parsed.data.station,
    stationKey: parsed.data.stationKey,
  });
  if (auth.response) return auth.response;

  const signals = await prisma.passSignal.findMany({
    where: {
      id: { in: parsed.data.signalIds },
      venueId: auth.venue.id,
      status: { in: ["READY", "PICKED_UP"] },
    },
    select: {
      id: true,
      venueId: true,
      station: true,
      status: true,
      readyAt: true,
      stationScreenId: true,
      tableNumber: true,
      roomNumber: true,
      sunbedNumber: true,
      venue: { select: { organizationId: true } },
    },
  });

  if (signals.length === 0) {
    return NextResponse.json({ dismissed: 0, message: "Δεν βρέθηκαν ενεργές ειδοποιήσεις." });
  }

  const primaryByStation = new Map<string, { id: string } | null>();
  const allowedIds: string[] = [];
  for (const existing of signals) {
    if (
      existing.stationScreenId &&
      auth.stationScreen?.id &&
      existing.stationScreenId !== auth.stationScreen.id
    ) {
      continue;
    }
    if (!existing.stationScreenId && auth.stationScreen?.id) {
      const signalStation = passStationDbToInput(existing.station);
      let primary = primaryByStation.get(signalStation);
      if (primary === undefined) {
        primary = await resolvePrimaryStationScreen(auth.venue.id, signalStation);
        primaryByStation.set(signalStation, primary);
      }
      if (primary?.id !== auth.stationScreen.id) {
        continue;
      }
    }
    allowedIds.push(existing.id);
  }

  if (allowedIds.length === 0) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }

  const allowedSignals = signals.filter((row) => allowedIds.includes(row.id));
  if (!passSignalsEligibleForManualClear(allowedSignals)) {
    return NextResponse.json(
      {
        error:
          "Δεν γίνεται καθάρισμα πριν περάσουν 24 ώρες. Οι ειδοποιήσεις κλείνουν αυτόματα μετά από 24 ώρες.",
        code: "clear_too_soon",
      },
      { status: 400 },
    );
  }

  await prisma.passSignal.deleteMany({ where: { id: { in: allowedIds } } });

  const opsConfig = await getVenueOperationsConfig(auth.venue.id);
  for (const existing of signals.filter((row) => allowedIds.includes(row.id))) {
    logPassSignalStatusChange({
      organizationId: existing.venue.organizationId,
      venueId: existing.venueId,
      signalId: existing.id,
      station: existing.station,
      location: formatWaiterCallLocation(existing),
      status: "CANCELED",
      readyAt: existing.readyAt,
      stationDisplayName: stationDisplayLabel(opsConfig, passStationDbToInput(existing.station)),
    });
  }

  return NextResponse.json({
    dismissed: allowedIds.length,
    message: "Οι ειδοποιήσεις αφαιρέθηκαν.",
  });
}
