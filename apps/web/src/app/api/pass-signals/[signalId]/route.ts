import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import {
  formatWaiterCallLocation,
  passSignalStationCancelSchema,
  passSignalStatusUpdateSchema,
  passSignalVisibleToStaffMember,
  passStationDbToInput,
  passStationInputToDb,
  listVenuePosts,
  stationDisplayLabel,
} from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { logPassSignalStatusChange } from "@/lib/push-diagnostics";
import { resolvePrimaryStationScreen } from "@/lib/station-screens";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

type Props = { params: Promise<{ signalId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const { signalId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρη κατάσταση." }, { status: 400 });
  }

  const existing = await prisma.passSignal.findUnique({
    where: { id: signalId },
    select: {
      id: true,
      venueId: true,
      station: true,
      status: true,
      readyAt: true,
      tableNumber: true,
      roomNumber: true,
      sunbedNumber: true,
      venue: { select: { organizationId: true } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η ειδοποίηση δεν βρέθηκε." }, { status: 404 });
  }

  const fakeRequest = parsed.data.staffKey
    ? new Request(request.url, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          "x-menuos-staff-key": parsed.data.staffKey,
        },
      })
    : request;

  const auth = await requireWaiterVenueAccess(fakeRequest, existing.venueId);
  if (auth.response) return auth.response;

  const member = auth.access.staffMember;
  if (member) {
    const opsConfig = await getVenueOperationsConfig(existing.venueId);
    const posts = listVenuePosts(opsConfig);
    if (!passSignalVisibleToStaffMember(existing.station, member.stations, posts)) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
    }
  }

  const next = parsed.data.status;
  const allowed: Record<string, string[]> = {
    READY: ["PICKED_UP", "DELIVERED"],
    PICKED_UP: ["DELIVERED"],
    DELIVERED: [],
  };
  if (!allowed[existing.status]?.includes(next)) {
    return NextResponse.json({ error: "Η κατάσταση δεν επιτρέπεται." }, { status: 409 });
  }

  const now = new Date();
  const signal = await prisma.passSignal.update({
    where: { id: signalId },
    data: {
      status: next,
      ...(next === "PICKED_UP" ? { pickedUpAt: now } : {}),
      ...(next === "DELIVERED"
        ? {
            deliveredAt: now,
            ...(existing.status === "READY" ? { pickedUpAt: now } : {}),
            ...(member ? { deliveredByStaffMemberId: member.id } : {}),
          }
        : {}),
    },
  });

  if (next === "PICKED_UP" || next === "DELIVERED") {
    const opsConfig = await getVenueOperationsConfig(existing.venueId);
    logPassSignalStatusChange({
      organizationId: existing.venue.organizationId,
      venueId: existing.venueId,
      signalId: existing.id,
      station: existing.station,
      location: formatWaiterCallLocation(existing),
      status: next,
      staffMemberName: member?.name ?? null,
      readyAt: existing.readyAt,
      stationDisplayName: stationDisplayLabel(opsConfig, passStationDbToInput(existing.station)),
    });
  }

  return NextResponse.json({ signal });
}

export async function DELETE(request: Request, { params }: Props) {
  const { signalId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalStationCancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const existing = await prisma.passSignal.findUnique({
    where: { id: signalId },
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
  if (!existing) {
    return NextResponse.json({ error: "Η ειδοποίηση δεν βρέθηκε." }, { status: 404 });
  }
  if (existing.status !== "READY") {
    return NextResponse.json(
      { error: "Δεν μπορείς να ακυρώσεις — ο σερβιτόρος το έχει ήδη πάρει.", code: "not_cancelable" },
      { status: 409 },
    );
  }

  const auth = await authorizePassSignalCreate(request, {
    venueSlug: parsed.data.venueSlug,
    station: parsed.data.station,
    stationKey: parsed.data.stationKey,
  });
  if (auth.response) return auth.response;
  if (auth.venue.id !== existing.venueId) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 401 });
  }
  if (existing.station !== passStationInputToDb(parsed.data.station)) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }
  if (
    existing.stationScreenId &&
    auth.stationScreen?.id &&
    existing.stationScreenId !== auth.stationScreen.id
  ) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }
  if (!existing.stationScreenId && auth.stationScreen?.id) {
    const primary = await resolvePrimaryStationScreen(auth.venue.id, parsed.data.station);
    if (primary?.id !== auth.stationScreen.id) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
    }
  }

  await prisma.passSignal.delete({ where: { id: signalId } });

  const opsConfig = await getVenueOperationsConfig(existing.venueId);
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

  return NextResponse.json({ message: "Η ειδοποίηση ακυρώθηκε." });
}
