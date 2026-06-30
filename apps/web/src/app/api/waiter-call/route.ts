import { NextResponse } from "next/server";
import { prisma, WaiterCallStatus, WaiterCallType } from "@menuos/db";
import { mergeOrderPayload, waiterCallSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
import { getVenueForOrganization } from "@/lib/venue-access";
import { pushStaffWaiterCall } from "@/lib/waiter-call-push";
import type { StaffWaiterNotifyReason } from "@/lib/staff-push-notify";

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
  const rateKey = `waiter-post:${ip}:${parsed.data.venueSlug}:${parsed.data.type}`;
  const rateLimit = await checkRateLimitOutcome(rateKey, 12, 60_000);
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
      const wasAcknowledged = existing.status === "ACKNOWLEDGED";
      const updated = await prisma.waiterCall.update({
        where: { id: existing.id },
        data: {
          orderItems: merged,
          ...(wasAcknowledged ? { status: WaiterCallStatus.PENDING } : {}),
        },
      });
      if (updated.status === "PENDING") {
        pushStaffWaiterCall(
          venue,
          updated,
          wasAcknowledged ? "reopened" : "order_updated",
        );
      }
      return NextResponse.json({
        id: updated.id,
        type: updated.type,
        status: updated.status,
        cancellable: updated.status === "PENDING",
      });
    }
    return NextResponse.json({
      id: existing.id,
      type: existing.type,
      status: existing.status,
      cancellable: existing.status === "PENDING",
    });
  }

  const result = await prisma.$transaction(async (tx): Promise<{
    call: Awaited<ReturnType<typeof tx.waiterCall.create>>;
    notify: StaffWaiterNotifyReason | null;
  }> => {
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
        const wasAcknowledged = pending.status === "ACKNOWLEDGED";
        const updated = await tx.waiterCall.update({
          where: { id: pending.id },
          data: {
            orderItems: merged,
            ...(wasAcknowledged ? { status: WaiterCallStatus.PENDING } : {}),
          },
        });
        const notifyReason: StaffWaiterNotifyReason = wasAcknowledged ? "reopened" : "order_updated";
        return {
          call: updated,
          notify: notifyReason,
        };
      }
      return { call: pending, notify: null };
    }

    const created = await tx.waiterCall.create({
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
    return { call: created, notify: "new" };
  });

  if (result.notify) {
    pushStaffWaiterCall(venue, result.call, result.notify);
  }

  const call = result.call;

  return NextResponse.json({
    id: call.id,
    type: call.type,
    status: call.status,
    cancellable: call.status === "PENDING",
  });
  } catch (err) {
    console.error("[menuos] waiter-call POST failed", err);
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 500 });
  }
}
