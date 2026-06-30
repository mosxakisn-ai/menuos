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
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waiterCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `waiter:${ip}:${parsed.data.venueSlug}`;
  if (!checkRateLimit(rateKey, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests", code: "rate_limited" },
      { status: 429 },
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { slug: parsed.data.venueSlug },
    include: { organization: { include: { subscription: true } } },
  });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  if (!organizationIsPubliclyActive(venue.organization.subscription)) {
    return NextResponse.json(
      { error: "Service unavailable", code: "subscription_inactive" },
      { status: 403 },
    );
  }

  const call = await prisma.waiterCall.create({
    data: {
      venueId: venue.id,
      type: parsed.data.type as WaiterCallType,
      tableNumber: parsed.data.tableNumber,
      roomNumber: parsed.data.roomNumber,
      status: WaiterCallStatus.PENDING,
    },
  });

  return NextResponse.json({ id: call.id, type: call.type });
}
