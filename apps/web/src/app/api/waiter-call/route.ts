import { NextResponse } from "next/server";
import { prisma, WaiterCallStatus } from "@menuos/db";
import { waiterCallSchema } from "@menuos/shared";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waiterCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `waiter:${ip}:${parsed.data.venueSlug}`;
  if (!checkRateLimit(rateKey, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const venue = await prisma.venue.findUnique({
    where: { slug: parsed.data.venueSlug },
  });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const call = await prisma.waiterCall.create({
    data: {
      venueId: venue.id,
      tableNumber: parsed.data.tableNumber,
      roomNumber: parsed.data.roomNumber,
      status: WaiterCallStatus.PENDING,
    },
  });

  return NextResponse.json({ id: call.id });
}
