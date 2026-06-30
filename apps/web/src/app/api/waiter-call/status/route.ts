import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const venueSlug = searchParams.get("venueSlug");

  if (!callId || !venueSlug) {
    return NextResponse.json({ error: "callId and venueSlug required" }, { status: 400 });
  }

  const call = await prisma.waiterCall.findFirst({
    where: { id: callId, venue: { slug: venueSlug } },
    select: { status: true, type: true },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: call.status,
    type: call.type,
    cancellable: call.status === "PENDING",
  });
}
