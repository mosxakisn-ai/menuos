import { prisma } from "@menuos/db";
import { ONBOARDING_STARTER_CATEGORIES } from "@menuos/shared";

/** Feature launch — venues created before this skip the QR cookie requirement (grandfather). */
export const MANDATORY_ONBOARDING_FROM = new Date("2026-07-04T00:00:00.000Z");

export type CatalogPreviewCategory = {
  name: string;
  items: { name: string; price: string }[];
};

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
  catalogPreview: CatalogPreviewCategory[];
};

function greekName(translations: { language: string; name: string }[]): string {
  return translations.find((t) => t.language === "GR")?.name ?? translations[0]?.name ?? "";
}

/** Static preview for onboarding step 2 before catalog is saved. */
export function getStarterCatalogPreview(): CatalogPreviewCategory[] {
  return ONBOARDING_STARTER_CATEGORIES.map((cat) => ({
    name: cat.nameGr,
    items: cat.items.map((item) => ({
      name: item.nameGr,
      price: item.price.toString(),
    })),
  }));
}

export async function getOnboardingStatus(organizationId: string): Promise<OnboardingStatus> {
  const venues = await prisma.venue.findMany({
    where: { organizationId },
    include: {
      menus: {
        include: {
          categories: {
            include: {
              translations: true,
              items: { include: { translations: true } },
            },
          },
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
  const firstMenu = firstVenue?.menus[0];
  const catalogPreview: CatalogPreviewCategory[] =
    firstMenu?.categories.map((cat) => ({
      name: greekName(cat.translations),
      items: cat.items.map((item) => ({
        name: greekName(item.translations),
        price: item.price.toString(),
      })),
    })) ?? [];

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
    catalogPreview,
  };
}

function isGrandfatheredOnboarding(status: OnboardingStatus): boolean {
  return Boolean(
    status.firstVenueCreatedAt && status.firstVenueCreatedAt < MANDATORY_ONBOARDING_FROM,
  );
}

export function isOnboardingComplete(
  status: OnboardingStatus,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (isGrandfatheredOnboarding(status)) return true;
  if (!confirmed) return false;
  return isOnboardingSetupComplete(status, qrVisited);
}

/** Steps 1–3 complete (venue, catalog saved, QR page visited this session). */
export function isOnboardingSetupComplete(status: OnboardingStatus, qrVisited: boolean): boolean {
  if (!status.hasVenue || !status.hasItem) return false;
  if (qrVisited || isGrandfatheredOnboarding(status)) return true;
  return false;
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
export function getOnboardingCurrentStepIndex(
  status: OnboardingStatus,
  qrVisited: boolean,
): number {
  if (isOnboardingSetupComplete(status, qrVisited)) return 3;
  if (!status.hasVenue) return 0;
  if (!status.hasItem) return 1;
  if (!qrVisited) return 2;
  return 3;
}

function isDashboardOverview(pathname: string): boolean {
  return pathname === "/dashboard" || pathname === "/dashboard/";
}

/** Paths allowed while onboarding is incomplete (ADMIN/MANAGER). */
export function isOnboardingPathAllowed(
  pathname: string,
  status: OnboardingStatus,
  qrVisited: boolean,
  confirmed: boolean,
): boolean {
  if (isOnboardingComplete(status, qrVisited, confirmed)) return true;
  if (pathname.startsWith("/dashboard/billing")) return true;
  if (isDashboardOverview(pathname)) return true;
  if (pathname.startsWith("/dashboard/settings")) return true;

  if (!status.hasVenue) {
    return pathname.startsWith("/dashboard/venues/new");
  }

  if (!status.hasItem) {
    return (
      pathname.startsWith("/dashboard/venues/new") || pathname.startsWith("/dashboard/menus")
    );
  }

  if (!qrVisited) {
    return pathname.startsWith("/dashboard/qr") || pathname.startsWith("/dashboard/venues/new");
  }

  if (!confirmed) {
    return pathname.startsWith("/dashboard/qr");
  }

  return true;
}
