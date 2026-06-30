import { NextResponse } from "next/server";
import { Prisma, prisma, WaiterCallStatus, WaiterCallType, type WaiterCall } from "@menuos/db";
import { mergeOrderPayload, type OrderPayload, waiterCallSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";
import { validateOrderItemsForVenue } from "@/lib/validate-order-items";
import { getVenueForOrganization } from "@/lib/venue-access";
import { pushStaffWaiterCall } from "@/lib/waiter-call-push";
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
  type: WaiterCallType,
): Promise<WaiterCall | null> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "WaiterCall"
    WHERE "venueId" = ${venueId}
      AND "tableNumber" IS NOT DISTINCT FROM ${tableNumber ?? null}
      AND "roomNumber" IS NOT DISTINCT FROM ${roomNumber ?? null}
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
  validatedOrder: OrderPayload | null,
): Promise<TxResult> {
  return prisma.$transaction(async (tx): Promise<TxResult> => {
    const existing = await lockActiveCall(tx, venue.id, tableNumber, roomNumber, callType);

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
        status: WaiterCallStatus.PENDING,
        orderItems: callType === "ORDER" && validatedOrder ? validatedOrder : undefined,
      },
    });
    return { call: created, notify: "new" };
  });
}

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
        parsed.data.tableNumber,
        parsed.data.roomNumber,
        validatedOrder,
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        result = await runWaiterCallTransaction(
          venue,
          callType,
          parsed.data.tableNumber,
          parsed.data.roomNumber,
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
