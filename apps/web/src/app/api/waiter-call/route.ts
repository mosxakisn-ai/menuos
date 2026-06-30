import { NextResponse } from "next/server";
import { prisma, WaiterCallStatus, WaiterCallType } from "@menuos/db";
import { waiterCallSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getVenueForOrganization } from "@/lib/venue-access";

export async function GET(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const calls = await prisma.waiterCall.findMany({
    where: {
      venueId,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingCount = calls.filter((c) => c.status === "PENDING").length;

  return NextResponse.json({ calls, pendingCount });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = waiterCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `waiter:${ip}:${parsed.data.venueSlug}`;
  if (!(await checkRateLimit(rateKey, 5, 60_000))) {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { slug: parsed.data.venueSlug },
    include: { organization: { include: { subscription: true } } },
  });
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  if (!organizationIsPubliclyActive(venue.organization.subscription)) {
    return NextResponse.json(
      { error: "Η υπηρεσία δεν είναι διαθέσιμη.", code: "subscription_inactive" },
      { status: 403 },
    );
  }

  if (!parsed.data.tableNumber && !parsed.data.roomNumber) {
    return NextResponse.json(
      { error: "Απαιτείται αριθμός τραπεζιού ή δωματίου.", code: "location_required" },
      { status: 400 },
    );
  }

  const existing = await prisma.waiterCall.findFirst({
    where: {
      venueId: venue.id,
      tableNumber: parsed.data.tableNumber ?? null,
      roomNumber: parsed.data.roomNumber ?? null,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    if (existing.type !== parsed.data.type) {
      return NextResponse.json(
        { error: "Υπάρχει ήδη ενεργή κλήση διαφορετικού τύπου.", code: "call_type_mismatch" },
        { status: 409 },
      );
    }
    return NextResponse.json({ id: existing.id, type: existing.type });
  }

  const call = await prisma.$transaction(async (tx) => {
    const pending = await tx.waiterCall.findFirst({
      where: {
        venueId: venue.id,
        tableNumber: parsed.data.tableNumber ?? null,
        roomNumber: parsed.data.roomNumber ?? null,
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (pending) return pending;

    return tx.waiterCall.create({
      data: {
        venueId: venue.id,
        type: parsed.data.type as WaiterCallType,
        tableNumber: parsed.data.tableNumber,
        roomNumber: parsed.data.roomNumber,
        status: WaiterCallStatus.PENDING,
      },
    });
  });

  if (call.type !== parsed.data.type) {
    return NextResponse.json(
      { error: "Υπάρχει ήδη ενεργή κλήση διαφορετικού τύπου.", code: "call_type_mismatch" },
      { status: 409 },
    );
  }

  return NextResponse.json({ id: call.id, type: call.type });
}
