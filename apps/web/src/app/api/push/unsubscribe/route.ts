import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { pushUnsubscribeSchema } from "@menuos/shared";
import { requireSession } from "@/lib/api-auth";
import { resolveVenueByStaffKey, resolveStaffKey } from "@/lib/staff-auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα στοιχεία." }, { status: 400 });
  }

  if (parsed.data.venueId) {
    const staffKey = parsed.data.staffKey ?? (await resolveStaffKey(request, parsed.data.venueId));
    if (!staffKey) {
      return NextResponse.json({ error: "Μη έγκυρο link σερβιτόρου." }, { status: 401 });
    }
    const venue = await resolveVenueByStaffKey(parsed.data.venueId, staffKey);
    if (!venue) {
      return NextResponse.json({ error: "Μη έγκυρο link σερβιτόρου." }, { status: 401 });
    }
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: parsed.data.endpoint,
        organizationId: venue.organizationId,
      },
    });
    return NextResponse.json({ ok: true });
  }

  const auth = await requireSession();
  if (auth.response) return auth.response;

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint: parsed.data.endpoint,
      userId: auth.session!.userId,
    },
  });

  return NextResponse.json({ ok: true });
}
