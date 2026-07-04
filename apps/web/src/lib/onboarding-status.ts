import { prisma } from "@menuos/db";
import { ONBOARDING_STARTER_CATEGORIES } from "@menuos/shared";

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

export {
  isOnboardingComplete,
  isOnboardingSetupComplete,
  needsOnboardingConfirmation,
  getOnboardingCurrentStepIndex,
  isOnboardingPathAllowed,
  isOnboardingNavHrefBlocked,
  MANDATORY_ONBOARDING_FROM,
} from "@/lib/onboarding-logic";

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
