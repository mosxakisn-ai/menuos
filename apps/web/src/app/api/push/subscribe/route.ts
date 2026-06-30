import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { pushSubscriptionSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { isPushEnabled } from "@/lib/push-config";
import { resolveVenueByStaffKey } from "@/lib/staff-auth";

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

  if (parsed.data.staffKey && parsed.data.venueId) {
    const venue = await resolveVenueByStaffKey(parsed.data.venueId, parsed.data.staffKey);
    if (!venue) {
      return NextResponse.json({ error: "Μη έγκυρο link σερβιτόρου." }, { status: 401 });
    }
    organizationId = venue.organizationId;
    venueId = venue.id;
  } else {
    const auth = await requireActiveSubscription();
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
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
    update: {
      userId,
      organizationId,
      venueId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
