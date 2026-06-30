import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { pushSubscriptionSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { isPushEnabled } from "@/lib/push-config";

export async function POST(request: Request) {
  if (!isPushEnabled()) {
    return NextResponse.json({ error: "Οι ειδοποιήσεις δεν είναι ενεργές." }, { status: 503 });
  }

  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

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

  const owned = await prisma.pushSubscription.findUnique({
    where: { endpoint: parsed.data.endpoint },
    select: { organizationId: true },
  });
  if (owned && owned.organizationId !== auth.session!.organizationId) {
    return NextResponse.json({ error: "Το endpoint ανήκει σε άλλο λογαριασμό." }, { status: 403 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: auth.session!.userId,
      organizationId: auth.session!.organizationId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
    update: {
      userId: auth.session!.userId,
      organizationId: auth.session!.organizationId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
