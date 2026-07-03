import { NextResponse } from "next/server";
import {
  venueOperationsConfigSchema,
  zodFirstErrorMessage,
} from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getVenueForOrganization } from "@/lib/venue-access";
import {
  getVenueOperationsConfig,
  saveVenueOperationsConfig,
} from "@/lib/venue-operations-config-service";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";

type Params = { params: Promise<{ venueId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER", "STAFF"] });
  if (auth.response) return auth.response;

  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 });
  }

  const config = await getVenueOperationsConfig(venueId);
  return NextResponse.json({ config });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const { venueId } = await params;
  const venue = await getVenueForOrganization(venueId, auth.session!.organizationId);
  if (!venue) {
    return NextResponse.json({ error: copy.api.venueNotFound }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: copy.api.badRequest }, { status: 400 });
  }

  const parsed = venueOperationsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodFirstErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const config = await saveVenueOperationsConfig(venueId, parsed.data);
    return NextResponse.json({
      config,
      message: copy.pages.settings.operations.saved,
    });
  } catch {
    return NextResponse.json({ error: copy.api.invalidData }, { status: 400 });
  }
}
