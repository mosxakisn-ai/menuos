import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/api-auth";
import { listVenuesForOrganization } from "@/lib/venue-access";
import { createVenueHandler } from "@/lib/venues-api";

export async function GET() {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const venues = await listVenuesForOrganization(auth.session!.organizationId);
  return NextResponse.json({ venues });
}

export async function POST(request: Request) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;
  return createVenueHandler(request, auth.session!.organizationId);
}
