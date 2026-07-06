import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import type { PassStationInput } from "@menuos/shared";
import { getSession } from "@/lib/auth";
import { getVenueForOrganization } from "@/lib/venue-access";
import { getOrganizationPlanContext, organizationCanUseLive360 } from "@/lib/billing";
import type { StaffVenueContext } from "@/lib/staff-auth";
import { legacyVenueTokenMatches, resolvePrimaryStationScreen, resolveStationScreenByToken } from "@/lib/station-screens";

export type PassSignalVenue = StaffVenueContext & {
  kitchenScreenToken: string;
  barScreenToken: string;
  coldScreenToken: string;
  dessertScreenToken: string;
};

export type PassSignalStationScreen = {
  id: string;
  label: string;
  spotPrefix?: string | null;
  quickChips?: string[];
};

export type PassSignalAuthSuccess = {
  venue: PassSignalVenue;
  stationScreen: PassSignalStationScreen | null;
  response: null;
};

export type PassSignalAuthFailure = {
  venue: null;
  stationScreen: null;
  response: NextResponse;
};

const VENUE_SCREEN_SELECT = {
  id: true,
  slug: true,
  name: true,
  organizationId: true,
  kitchenScreenToken: true,
  barScreenToken: true,
  coldScreenToken: true,
  dessertScreenToken: true,
} as const;

async function loadVenueById(venueId: string): Promise<PassSignalVenue | null> {
  return prisma.venue.findUnique({
    where: { id: venueId },
    select: VENUE_SCREEN_SELECT,
  });
}

async function loadVenueBySlug(slug: string): Promise<PassSignalVenue | null> {
  return prisma.venue.findUnique({
    where: { slug },
    select: VENUE_SCREEN_SELECT,
  });
}

const SCREEN_STATIONS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

/** Dashboard session or department screen token (KDS/BDS). */
export async function authorizePassSignalCreate(
  request: Request,
  input: {
    venueId?: string;
    venueSlug?: string;
    station: PassStationInput;
    stationKey?: string;
  },
): Promise<PassSignalAuthSuccess | PassSignalAuthFailure> {
  const venue =
    (input.venueId ? await loadVenueById(input.venueId) : null) ??
    (input.venueSlug ? await loadVenueBySlug(input.venueSlug.trim()) : null);

  if (!venue) {
    return {
      venue: null,
      stationScreen: null,
      response: NextResponse.json({ error: "Το κατάστημα δεν βρέθηκε." }, { status: 404 }),
    };
  }

  const planCtx = await getOrganizationPlanContext(venue.organizationId);
  if (!planCtx?.active) {
    return {
      venue: null,
      stationScreen: null,
      response: NextResponse.json(
        { error: "Η συνδρομή δεν είναι ενεργή.", code: "subscription_inactive" },
        { status: 403 },
      ),
    };
  }

  if (!organizationCanUseLive360(planCtx.planId)) {
    return {
      venue: null,
      stationScreen: null,
      response: NextResponse.json(
        { error: "Το Live 360° είναι διαθέσιμο στο πλάνο Pro.", code: "pro_required" },
        { status: 403 },
      ),
    };
  }

  const key = input.stationKey?.trim();
  if (key && SCREEN_STATIONS.includes(input.station)) {
    const stationScreen = await resolveStationScreenByToken(venue.id, input.station, key);
    if (stationScreen) {
      return { venue, stationScreen, response: null };
    }
    if (legacyVenueTokenMatches(venue, input.station, key)) {
      const primary = await resolvePrimaryStationScreen(venue.id, input.station);
      return { venue, stationScreen: primary, response: null };
    }
    return {
      venue: null,
      stationScreen: null,
      response: NextResponse.json({ error: "Μη εξουσιοδοτημένο.", code: "unauthorized" }, { status: 401 }),
    };
  }

  const session = await getSession();
  if (session) {
    const owned = await getVenueForOrganization(venue.id, session.organizationId);
    if (owned) return { venue, stationScreen: null, response: null };
  }

  return {
    venue: null,
    stationScreen: null,
    response: NextResponse.json({ error: "Μη εξουσιοδοτημένο.", code: "unauthorized" }, { status: 401 }),
  };
}

export function buildStationScreenUrl(
  path: "/kds" | "/bds" | "/cold" | "/dessert",
  slug: string,
  screenToken: string,
  opts?: { allPosts?: boolean },
): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") ?? "https://menuos.gr";
  const url = new URL(path, base);
  url.searchParams.set("venueSlug", slug);
  url.searchParams.set("key", screenToken);
  if (opts?.allPosts) url.searchParams.set("allPosts", "1");
  return url.toString();
}
