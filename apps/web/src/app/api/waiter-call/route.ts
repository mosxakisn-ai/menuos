import { NextResponse } from "next/server";
import { Prisma, prisma, WaiterCallStatus, WaiterCallType, type WaiterCall } from "@menuos/db";
import {
  mergeOrderPayload,
  parseOrderPayload,
  type OrderPayload,
  waiterCallSchema,
  normalizeWaiterCallLocation,
  waiterCallsVisibleToStaffMember,
} from "@menuos/shared";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { organizationCanUseLive360 } from "@/lib/billing";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
import { validateOrderItemsForVenue } from "@/lib/validate-order-items";
import { pushStaffWaiterCall } from "@/lib/waiter-call-push";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";
import type { StaffWaiterNotifyReason } from "@/lib/staff-push-notify";

type TxResult = {
  call: WaiterCall;
  notify: StaffWaiterNotifyReason | null;
};

type VenueWithOrg = NonNullable<
  Awaited<
    ReturnType<
      typeof prisma.venue.findUnique<{
        where: { slug: string };
        include: { organization: { include: { subscription: true } } };
      }>
    >
  >
>;

async function lockActiveCall(
  tx: Prisma.TransactionClient,
  venueId: string,
  tableNumber: string | null | undefined,
  roomNumber: string | null | undefined,
  sunbedNumber: string | null | undefined,
  type: WaiterCallType,
): Promise<WaiterCall | null> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "WaiterCall"
    WHERE "venueId" = ${venueId}
      AND "tableNumber" IS NOT DISTINCT FROM ${tableNumber ?? null}
      AND "roomNumber" IS NOT DISTINCT FROM ${roomNumber ?? null}
      AND "sunbedNumber" IS NOT DISTINCT FROM ${sunbedNumber ?? null}
      AND type = ${type}::"WaiterCallType"
      AND status IN ('PENDING', 'ACKNOWLEDGED')
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE
  `;
  if (!rows[0]) return null;
  return tx.waiterCall.findUnique({ where: { id: rows[0].id } });
}

async function runWaiterCallTransaction(
  venue: VenueWithOrg,
  callType: WaiterCallType,
  tableNumber: string | undefined,
  roomNumber: string | undefined,
  sunbedNumber: string | undefined,
  validatedOrder: OrderPayload | null,
): Promise<TxResult> {
  return prisma.$transaction(async (tx): Promise<TxResult> => {
    const existing = await lockActiveCall(
      tx,
      venue.id,
      tableNumber,
      roomNumber,
      sunbedNumber,
      callType,
    );

    if (existing) {
      if (callType === "ORDER" && validatedOrder) {
        const merged = mergeOrderPayload(existing.orderItems, validatedOrder);
        const wasAcknowledged = existing.status === "ACKNOWLEDGED";
        const updated = await tx.waiterCall.update({
          where: { id: existing.id },
          data: {
            orderItems: merged,
            ...(wasAcknowledged ? { status: WaiterCallStatus.PENDING } : {}),
          },
        });
        return {
          call: updated,
          notify: wasAcknowledged ? "reopened" : "order_updated",
        };
      }
      return { call: existing, notify: null };
    }

    const created = await tx.waiterCall.create({
      data: {
        venueId: venue.id,
        type: callType,
        tableNumber,
        roomNumber,
        sunbedNumber,
        status: WaiterCallStatus.PENDING,
        orderItems: callType === "ORDER" && validatedOrder ? validatedOrder : undefined,
      },
    });
    return { call: created, notify: "new" };
  });
}

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const auth = await requireWaiterVenueAccess(request, venueId);
  if (auth.response) return auth.response;

  const member = auth.access.staffMember;
  const canSeeWaiterCalls = !member || waiterCallsVisibleToStaffMember(member.stations);

  const [calls, spots] = await Promise.all([
    canSeeWaiterCalls
      ? prisma.waiterCall.findMany({
          where: {
            venueId,
            status: { in: ["PENDING", "ACKNOWLEDGED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    prisma.venueSpot.findMany({
      where: { venueId },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, type: true, label: true },
    }),
  ]);

  const pendingCount = calls.filter((c) => c.status === "PENDING").length;

  return NextResponse.json({
    calls: calls.map((call) => ({
      ...call,
      orderItems: call.type === "ORDER" ? parseOrderPayload(call.orderItems) : null,
    })),
    pendingCount,
    spots,
    staffMember: member ? { id: member.id, name: member.name } : null,
  });
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

    const planId = venue.organization.subscription?.plan ?? "TRIAL";
    if (!organizationCanUseLive360(planId)) {
      return NextResponse.json(
        { error: "Το Live 360° είναι διαθέσιμο στο πλάνο Pro.", code: "pro_required" },
        { status: 403 },
      );
    }

    if (!parsed.data.tableNumber && !parsed.data.roomNumber && !parsed.data.sunbedNumber) {
      return NextResponse.json(
        { error: "Απαιτείται τραπέζι, δωμάτιο ή ξαπλώστρα.", code: "location_required" },
        { status: 400 },
      );
    }

    const location = normalizeWaiterCallLocation(parsed.data);

    const callType = parsed.data.type as WaiterCallType;
    let validatedOrder: OrderPayload | null = null;
    if (callType === "ORDER") {
      if (!parsed.data.orderItems?.lines.length) {
        return NextResponse.json({ error: "Η παραγγελία είναι κενή.", code: "empty_order" }, { status: 400 });
      }
      validatedOrder = await validateOrderItemsForVenue(venue.id, parsed.data.orderItems);
      if (!validatedOrder) {
        return NextResponse.json(
          { error: "Μη έγκυρα πιάτα στην παραγγελία.", code: "invalid_order" },
          { status: 400 },
        );
      }
    }

    let result: TxResult;
    try {
      result = await runWaiterCallTransaction(
        venue,
        callType,
        location.tableNumber,
        location.roomNumber,
        location.sunbedNumber,
        validatedOrder,
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        result = await runWaiterCallTransaction(
          venue,
          callType,
          location.tableNumber,
          location.roomNumber,
          location.sunbedNumber,
          validatedOrder,
        );
      } else {
        throw err;
      }
    }

    if (result.notify) {
      pushStaffWaiterCall(venue, result.call, result.notify);
    }

    return NextResponse.json({
      id: result.call.id,
      type: result.call.type,
      status: result.call.status,
      cancellable: result.call.status === "PENDING",
    });
  } catch (err) {
    console.error("[menuos] waiter-call POST failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο.", code: "server_error" },
      { status: 500 },
    );
  }
}
