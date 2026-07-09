import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { listVenuePosts, passSignalSeenSchema, passSignalVisibleToStaffMember } from "@menuos/shared";
import { markPassSignalSeen } from "@/lib/pass-signal-delivery-service";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

type Props = { params: Promise<{ signalId: string }> };

export async function POST(request: Request, { params }: Props) {
  const { signalId } = await params;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalSeenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const existing = await prisma.passSignal.findUnique({
    where: { id: signalId },
    select: { id: true, venueId: true, station: true, status: true, firstSeenAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η ειδοποίηση δεν βρέθηκε." }, { status: 404 });
  }
  if (existing.status !== "READY") {
    return NextResponse.json({ ok: true, already: true });
  }
  if (existing.firstSeenAt) {
    return NextResponse.json({ ok: true, already: true });
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

  if (auth.access.mode === "session") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const member = auth.access.staffMember;
  if (!member) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }

  const opsConfig = await getVenueOperationsConfig(existing.venueId);
  const posts = listVenuePosts(opsConfig);
  if (!passSignalVisibleToStaffMember(existing.station, member.stations, posts)) {
    return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
  }

  const marked = await markPassSignalSeen(signalId, existing.venueId, member.id);

  return NextResponse.json({ ok: true, marked });
}
