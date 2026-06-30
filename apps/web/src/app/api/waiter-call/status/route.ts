import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const venueSlug = searchParams.get("venueSlug");

  if (!callId || !venueSlug) {
    return NextResponse.json({ error: "callId and venueSlug required" }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!checkRateLimit(`waiter-status:${ip}:${venueSlug}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests", code: "rate_limited" },
      { status: 429 },
    );
  }

  const call = await prisma.waiterCall.findFirst({
    where: { id: callId, venue: { slug: venueSlug } },
    select: { status: true, type: true },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const active = call.status === "PENDING" || call.status === "ACKNOWLEDGED";

  return NextResponse.json({
    status: call.status,
    type: call.type,
    active,
    cancellable: call.status === "PENDING",
  });
}
