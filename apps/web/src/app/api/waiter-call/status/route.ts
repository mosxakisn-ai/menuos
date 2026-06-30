import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const venueSlug = searchParams.get("venueSlug");

  if (!callId || !venueSlug) {
    return NextResponse.json({ error: "Απαιτούνται callId και venueSlug." }, { status: 400 });
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

  const call = await prisma.waiterCall.findFirst({
    where: { id: callId, venue: { slug: venueSlug } },
    select: { status: true, type: true },
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
  });
}
