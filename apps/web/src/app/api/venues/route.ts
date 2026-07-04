import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/api-auth";
import { canManageVenueSecrets } from "@/lib/dashboard-roles";
import { listVenuesForOrganization } from "@/lib/venue-access";
import { stripVenuesSecrets } from "@/lib/venue-secrets";
import { createVenueHandler } from "@/lib/venues-api";

export async function GET() {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const venues = await listVenuesForOrganization(auth.session!.organizationId);
  const includeSecrets = canManageVenueSecrets(auth.session!.role);
  return NextResponse.json({ venues: stripVenuesSecrets(venues, includeSecrets) });
}

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;
  return createVenueHandler(request, auth.session!.organizationId);
}
