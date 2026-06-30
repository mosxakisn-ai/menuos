import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { normalizeWaiterCallLocation, parseOrderPayload } from "@menuos/shared";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

function publicOrderSummary(raw: unknown) {
  const parsed = parseOrderPayload(raw);
  if (!parsed) return null;
  return { total: parsed.total, lineCount: parsed.lines.length };
}

function publicOrderItems(raw: unknown) {
  const parsed = parseOrderPayload(raw);
  if (!parsed) return null;
  return { lines: parsed.lines, total: parsed.total };
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const venueSlug = searchParams.get("venueSlug");
  const tableNumber = searchParams.get("tableNumber");
  const roomNumber = searchParams.get("roomNumber");
  const sunbedNumber = searchParams.get("sunbedNumber");

  if (!venueSlug) {
    return NextResponse.json({ error: "Απαιτείται venueSlug." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateLimit = await checkRateLimitOutcome(`waiter-status:${ip}:${venueSlug}`, 30, 60_000);
  if (rateLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (rateLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  if (callId) {
    const call = await prisma.waiterCall.findFirst({
      where: { id: callId, venue: { slug: venueSlug } },
      select: { status: true, type: true, orderItems: true },
    });

    if (!call) {
      return NextResponse.json({ error: "Η κλήση δεν βρέθηκε." }, { status: 404 });
    }

    const active = call.status === "PENDING" || call.status === "ACKNOWLEDGED";

    return NextResponse.json({
      status: call.status,
      type: call.type,
      active,
      cancellable: call.status === "PENDING",
      orderItems: call.type === "ORDER" ? publicOrderItems(call.orderItems) : null,
    });
  }

  if (!tableNumber && !roomNumber && !sunbedNumber) {
    return NextResponse.json({ error: "Απαιτούνται callId ή tableNumber/roomNumber/sunbedNumber." }, { status: 400 });
  }

  const loc = normalizeWaiterCallLocation({
    tableNumber: tableNumber ?? undefined,
    roomNumber: roomNumber ?? undefined,
    sunbedNumber: sunbedNumber ?? undefined,
  });

  const calls = await prisma.waiterCall.findMany({
    where: {
      venue: { slug: venueSlug },
      tableNumber: loc.tableNumber ?? null,
      roomNumber: loc.roomNumber ?? null,
      sunbedNumber: loc.sunbedNumber ?? null,
      status: { in: ["PENDING", "ACKNOWLEDGED"] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, type: true, orderItems: true },
  });

  return NextResponse.json({
    calls: calls.map((call) => ({
      id: call.id,
      status: call.status,
      type: call.type,
      active: true,
      cancellable: call.status === "PENDING",
      orderSummary: call.type === "ORDER" ? publicOrderSummary(call.orderItems) : null,
    })),
  });
}
