import { prisma } from "@menuos/db";

/** Feature launch — venues created before this skip the QR cookie requirement (grandfather). */
export const MANDATORY_ONBOARDING_FROM = new Date("2026-07-04T00:00:00.000Z");

export type OnboardingStatus = {
  hasVenue: boolean;
  hasCategory: boolean;
  hasItem: boolean;
  venueCount: number;
  menuCount: number;
  itemCount: number;
  firstVenueId?: string;
  firstVenueSlug?: string;
  firstVenueName?: string;
  firstVenueDescription?: string | null;
  firstVenueCreatedAt?: Date;
};

export async function getOnboardingStatus(organizationId: string): Promise<OnboardingStatus> {
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    include: {
      menus: {
        include: {
          categories: { include: { items: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const venueCount = venues.length;
  const menuCount = venues.reduce((n, v) => n + v.menus.length, 0);
  const itemCount = venues.reduce(
    (n, v) =>
      n + v.menus.reduce((m, menu) => m + menu.categories.reduce((c, cat) => c + cat.items.length, 0), 0),
    0,
  );
  const firstVenue = venues[0];

  return {
    hasVenue: venueCount > 0,
    hasCategory: venues.some((v) => v.menus.some((m) => m.categories.length > 0)),
    hasItem: itemCount > 0,
    venueCount,
    menuCount,
    itemCount,
    firstVenueId: firstVenue?.id,
    firstVenueSlug: firstVenue?.slug,
    firstVenueName: firstVenue?.name,
    firstVenueDescription: firstVenue?.description ?? null,
    firstVenueCreatedAt: firstVenue?.createdAt,
  };
}

function isGrandfatheredOnboarding(status: OnboardingStatus): boolean {
  return Boolean(
    status.firstVenueCreatedAt && status.firstVenueCreatedAt < MANDATORY_ONBOARDING_FROM,
  );
}

/** Steps 1–3 complete (venue, items, QR or grandfather). */
export function isOnboardingSetupComplete(status: OnboardingStatus, qrVisited: boolean): boolean {
  if (!status.hasVenue || !status.hasItem) return false;
  if (qrVisited || isGrandfatheredOnboarding(status)) return true;
  return false;
}

export function isOnboardingComplete(status: OnboardingStatus, qrVisited: boolean): boolean {
  return isOnboardingSetupComplete(status, qrVisited);
}

/** Step 4 confirmation popup — skip for grandfathered accounts. */
export function needsOnboardingConfirmation(
  status: OnboardingStatus,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (confirmed) return false;
  if (isGrandfatheredOnboarding(status)) return false;
  return isOnboardingSetupComplete(status, qrVisited);
}

/** 0 = venue, 1 = catalog, 2 = QR, 3 = all done */
export function getOnboardingCurrentStepIndex(status: OnboardingStatus, qrVisited: boolean): number {
  if (isOnboardingComplete(status, qrVisited)) return 3;
  if (!status.hasVenue) return 0;
  if (!status.hasItem) return 1;
  return 2;
}

/** Paths allowed while onboarding is incomplete (ADMIN/MANAGER). */
export function isOnboardingPathAllowed(
  pathname: string,
  status: OnboardingStatus,
  qrVisited: boolean,
): boolean {
  if (isOnboardingComplete(status, qrVisited)) return true;
  if (pathname.startsWith("/dashboard/billing")) return true;
  if (pathname === "/dashboard") return true;
  if (pathname.startsWith("/dashboard/settings")) return true;

  if (!status.hasVenue) {
    return pathname === "/dashboard/venues/new" || pathname.startsWith("/dashboard/venues/new/");
  }

  if (!status.hasItem) {
    return pathname.startsWith("/dashboard/menus") || pathname.startsWith("/dashboard/venues/new");
  }

  if (!qrVisited) {
    return (
      pathname.startsWith("/dashboard/qr") ||
      pathname.startsWith("/dashboard/menus") ||
      pathname.startsWith("/dashboard/venues/new")
    );
  }

  return true;
}
