import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";

const MAX_DAYS = 90;
const DEFAULT_DAYS = 7;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get("venueId");
  if (!venueId) {
    return NextResponse.json({ error: "Απαιτείται venueId." }, { status: 400 });
  }

  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const daysRaw = Number(searchParams.get("days") ?? DEFAULT_DAYS);
  const days = Number.isFinite(daysRaw)
    ? Math.min(MAX_DAYS, Math.max(1, Math.floor(daysRaw)))
    : DEFAULT_DAYS;
  const limitRaw = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limitRaw)))
    : DEFAULT_LIMIT;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const signals = await prisma.passSignal.findMany({
      where: {
        venueId,
        status: "DELIVERED",
        deliveredAt: { gte: since },
      },
      orderBy: { deliveredAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ signals, days, limit });
  } catch (err) {
    console.error("[menuos] pass-signals history GET failed", err);
    return NextResponse.json(
      { error: "Πρόβλημα διακομιστή.", code: "server_error" },
      { status: 500 },
    );
  }
}
