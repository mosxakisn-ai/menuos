import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { passSignalStationCancelSchema, passSignalStatusUpdateSchema } from "@menuos/shared";
import { authorizePassSignalCreate } from "@/lib/pass-signal-auth";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";

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
    select: { id: true, venueId: true, status: true },
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
          }
        : {}),
    },
  });

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
    select: { id: true, venueId: true, status: true, stationScreenId: true },
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
  if (
    auth.stationScreen?.id &&
    existing.stationScreenId &&
    existing.stationScreenId !== auth.stationScreen.id
  ) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }

  await prisma.passSignal.delete({ where: { id: signalId } });
  return NextResponse.json({ message: "Η ειδοποίηση ακυρώθηκε." });
}
