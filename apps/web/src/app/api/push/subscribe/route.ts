import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { pushSubscriptionSchema } from "@menuos/shared";
import { requireLive360Plan } from "@/lib/api-auth";
import { getOrganizationPlanContext, organizationCanUseLive360 } from "@/lib/billing";
import { isPushEnabled } from "@/lib/push-config";
import { resolveStaffAuthByKey, resolveStaffKey } from "@/lib/staff-auth";

export async function POST(request: Request) {
  if (!isPushEnabled()) {
    return NextResponse.json({ error: "Οι ειδοποιήσεις δεν είναι ενεργές." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  let organizationId: string;
  let userId: string | null = null;
  let venueId: string | null = null;
  let staffMemberId: string | null = null;

  if (parsed.data.venueId) {
    const staffKey = parsed.data.staffKey ?? (await resolveStaffKey(request, parsed.data.venueId));
    if (!staffKey) {
      return NextResponse.json({ error: "Μη έγκυρο link σερβιτόρου." }, { status: 401 });
    }
    const auth = await resolveStaffAuthByKey(parsed.data.venueId, staffKey);
    if (!auth) {
      return NextResponse.json({ error: "Μη έγκυρο link σερβιτόρου." }, { status: 401 });
    }
    const plan = await getOrganizationPlanContext(auth.venue.organizationId);
    if (!plan?.active) {
      return NextResponse.json(
        { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
        { status: 403 },
      );
    }
    if (!organizationCanUseLive360(plan.planId)) {
      return NextResponse.json(
        { error: "Το Live 360° είναι διαθέσιμο στο πλάνο Pro.", code: "pro_required" },
        { status: 403 },
      );
    }
    organizationId = auth.venue.organizationId;
    venueId = auth.venue.id;
    staffMemberId = auth.staffMember?.id ?? null;
  } else {
    const auth = await requireLive360Plan();
    if (auth.response) return auth.response;
    organizationId = auth.session!.organizationId;
    userId = auth.session!.userId;
  }

  const owned = await prisma.pushSubscription.findUnique({
    where: { endpoint: parsed.data.endpoint },
    select: { organizationId: true },
  });
  if (owned && owned.organizationId !== organizationId) {
    return NextResponse.json({ error: "Το endpoint ανήκει σε άλλο λογαριασμό." }, { status: 403 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId,
      organizationId,
      venueId,
      staffMemberId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
    update: {
      userId,
      organizationId,
      venueId,
      staffMemberId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
