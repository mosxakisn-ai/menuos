import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { waiterCallCancelSchema } from "@menuos/shared";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = waiterCallCancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `waiter-cancel:${ip}:${parsed.data.venueSlug}`;
  if (!(await checkRateLimit(rateKey, 8, 60_000))) {
    return NextResponse.json(
      { error: "Too many requests", code: "rate_limited" },
      { status: 429 },
    );
  }

  const call = await prisma.waiterCall.findFirst({
    where: {
      id: parsed.data.callId,
      venue: { slug: parsed.data.venueSlug },
    },
    include: { venue: { include: { organization: { include: { subscription: true } } } } },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found", code: "not_found" }, { status: 404 });
  }

  if (!organizationIsPubliclyActive(call.venue.organization.subscription)) {
    return NextResponse.json(
      { error: "Service unavailable", code: "subscription_inactive" },
      { status: 403 },
    );
  }

  if (call.status !== "PENDING") {
    return NextResponse.json(
      { error: "Call cannot be cancelled", code: "not_cancellable" },
      { status: 409 },
    );
  }

  await prisma.waiterCall.update({
    where: { id: call.id },
    data: { status: "CANCELED" },
  });

  return NextResponse.json({ ok: true, id: call.id });
}
