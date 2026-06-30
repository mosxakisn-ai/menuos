import { NextResponse } from "next/server";
import { prisma, WaiterCallStatus, WaiterCallType } from "@menuos/db";
import { mergeOrderPayload, waiterCallSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
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
  const rateLimit = await checkRateLimitOutcome(rateKey, 5, 60_000);
  if (rateLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (rateLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  try {
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
      type: parsed.data.type as WaiterCallType,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    if (
      parsed.data.type === "ORDER" &&
      parsed.data.orderItems &&
      parsed.data.orderItems.lines.length > 0
    ) {
      const merged = mergeOrderPayload(existing.orderItems, parsed.data.orderItems);
      const updated = await prisma.waiterCall.update({
        where: { id: existing.id },
        data: { orderItems: merged },
      });
      return NextResponse.json({ id: updated.id, type: updated.type });
    }
    return NextResponse.json({ id: existing.id, type: existing.type });
  }

  const call = await prisma.$transaction(async (tx) => {
    const pending = await tx.waiterCall.findFirst({
      where: {
        venueId: venue.id,
        tableNumber: parsed.data.tableNumber ?? null,
        roomNumber: parsed.data.roomNumber ?? null,
        type: parsed.data.type as WaiterCallType,
        status: { in: ["PENDING", "ACKNOWLEDGED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (pending) {
      if (
        pending.type === "ORDER" &&
        parsed.data.type === "ORDER" &&
        parsed.data.orderItems &&
        parsed.data.orderItems.lines.length > 0
      ) {
        const merged = mergeOrderPayload(pending.orderItems, parsed.data.orderItems);
        return tx.waiterCall.update({
          where: { id: pending.id },
          data: { orderItems: merged },
        });
      }
      return pending;
    }

    return tx.waiterCall.create({
      data: {
        venueId: venue.id,
        type: parsed.data.type as WaiterCallType,
        tableNumber: parsed.data.tableNumber,
        roomNumber: parsed.data.roomNumber,
        status: WaiterCallStatus.PENDING,
        orderItems:
          parsed.data.type === "ORDER" && parsed.data.orderItems
            ? parsed.data.orderItems
            : undefined,
      },
    });
  });

  return NextResponse.json({ id: call.id, type: call.type });
  } catch (err) {
    console.error("[menuos] waiter-call POST failed", err);
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 500 });
  }
}
