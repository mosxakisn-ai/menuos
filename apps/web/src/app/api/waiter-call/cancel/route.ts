import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { waiterCallCancelSchema, waiterCallLocationMatches } from "@menuos/shared";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { organizationCanUseLive360 } from "@/lib/billing";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = waiterCallCancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rateKey = `waiter-cancel:${ip}:${parsed.data.venueSlug}`;
  const rateLimit = await checkRateLimitOutcome(rateKey, 8, 60_000);
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
    where: {
      id: parsed.data.callId,
      venue: { slug: parsed.data.venueSlug },
    },
    include: { venue: { include: { organization: { include: { subscription: true } } } } },
  });

  if (!call) {
    return NextResponse.json({ error: "Η κλήση δεν βρέθηκε.", code: "not_found" }, { status: 404 });
  }

  if (!organizationIsPubliclyActive(call.venue.organization.subscription)) {
    return NextResponse.json(
      { error: "Η υπηρεσία δεν είναι διαθέσιμη.", code: "subscription_inactive" },
      { status: 403 },
    );
  }

  const planId = call.venue.organization.subscription?.plan ?? "TRIAL";
  if (!organizationCanUseLive360(planId)) {
    return NextResponse.json(
      { error: "Το Live 360° είναι διαθέσιμο στο πλάνο Pro.", code: "pro_required" },
      { status: 403 },
    );
  }

  if (call.status !== "PENDING") {
    return NextResponse.json(
      { error: "Η κλήση δεν μπορεί να ακυρωθεί.", code: "not_cancellable" },
      { status: 409 },
    );
  }

  if (!waiterCallLocationMatches(call, parsed.data)) {
    return NextResponse.json(
      { error: "Η κλήση δεν ανήκει σε αυτό το τραπέζι/δωμάτιο.", code: "wrong_location" },
      { status: 403 },
    );
  }

  const updated = await prisma.waiterCall.updateMany({
    where: { id: call.id, status: "PENDING" },
    data: { status: "CANCELED" },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Η κλήση δεν μπορεί να ακυρωθεί.", code: "not_cancellable" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, id: call.id });
}
