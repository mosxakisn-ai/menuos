import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import {
  DEFAULT_STATION_SCREEN_LABELS_EL,
  passStationInputToDb,
  venueSchema,
  venueUpdateSchema,
  type PassStationInput,
} from "@menuos/shared";
import { canOrganizationAddVenue } from "@/lib/billing";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import {
  assertCanAddVenueInTransaction,
  planLimitErrorResponse,
  serializableTransaction,
} from "@/lib/plan-limits";
import { legacyVenueScreenToken } from "@/lib/station-screens";
import { seedOnboardingVenueInTransaction } from "@/lib/seed-onboarding-venue";
import { allocateGlobalVenueSlug, baseVenueSlug } from "@/lib/venue-slug";

const DEFAULT_STATION_SCREENS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

export async function createVenueHandler(request: Request, organizationId: string) {
  const copy = dashboardCopyFromRequest(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  let parsed = venueSchema.safeParse(body);
  if (!parsed.success && typeof body === "object" && body && "name" in body) {
    parsed = venueSchema.safeParse({
      ...(body as Record<string, unknown>),
      slug: baseVenueSlug(String((body as { name: string }).name)),
    });
  }
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  const venueCheck = await canOrganizationAddVenue(organizationId);
  if (!venueCheck.ok) {
    return NextResponse.json({ code: venueCheck.code }, { status: 403 });
  }

  const slug = await allocateGlobalVenueSlug(parsed.data.name, parsed.data.slug);

  try {
    const venue = await prisma.$transaction(async (tx) => {
      await assertCanAddVenueInTransaction(tx, organizationId);
      const organization = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { slug: true },
      });
      const created = await tx.venue.create({
        data: {
          organizationId,
          name: parsed.data.name,
          slug,
          description: parsed.data.description,
          settings: { create: { brandName: parsed.data.name } },
          menus: {
            create: {
              name: copy.api.defaultMenuName,
              type: "RESTAURANT",
            },
          },
        },
        include: { menus: true },
      });

      for (const station of DEFAULT_STATION_SCREENS) {
        await tx.venueStationScreen.create({
          data: {
            venueId: created.id,
            station: passStationInputToDb(station),
            label: DEFAULT_STATION_SCREEN_LABELS_EL[station],
            screenToken: legacyVenueScreenToken(created, station),
            sortOrder: 0,
          },
        });
      }

      const menuId = created.menus[0]?.id;
      if (menuId) {
        await seedOnboardingVenueInTransaction(tx, {
          organizationSlug: organization.slug,
          venueId: created.id,
          venueSlug: created.slug,
          menuId,
        });
      }

      return created;
    }, serializableTransaction);

    return NextResponse.json({ venue, message: copy.venueCreated });
  } catch (err) {
    const limit = planLimitErrorResponse(err);
    if (limit) {
      return NextResponse.json({ code: limit.code }, { status: limit.status });
    }
    const code = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : null;
    if (code === "P2002") {
      return NextResponse.json({ code: "slug_exists" }, { status: 409 });
    }
    throw err;
  }
}
