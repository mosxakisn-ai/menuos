import { prisma } from "@menuos/db";
import { appendPhotoSignature } from "@/lib/photo-signing";
import { enrichPublicMenuTranslations } from "@/lib/enrich-public-menu-translations";

export async function loadPublicVenueMenu(venueSlug: string) {
  return prisma.venue.findUnique({
    where: { slug: venueSlug },
    include: {
      organization: { include: { subscription: true } },
      menus: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          categories: {
            orderBy: { sortOrder: "asc" },
            include: {
              translations: true,
              items: {
                where: { available: true },
                orderBy: { sortOrder: "asc" },
                include: { translations: true },
              },
            },
          },
        },
      },
    },
  });
}

type LoadedVenue = NonNullable<Awaited<ReturnType<typeof loadPublicVenueMenu>>>;

export async function buildPublicVenuePayload(venue: LoadedVenue) {
  const enrichedMenus = await enrichPublicMenuTranslations(venue.menus);

  return {
    name: venue.name,
    slug: venue.slug,
    logoUrl: appendPhotoSignature(venue.logoUrl),
    primaryColor: venue.primaryColor,
    description: venue.description,
    cuisineType: venue.cuisineType,
    menus: enrichedMenus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      translations: menu.translations,
      categories: menu.categories
        .filter((category) => category.items.length > 0)
        .map((category) => ({
          id: category.id,
          translations: category.translations,
          items: category.items.map((item) => ({
            id: item.id,
            price: item.price,
            photoUrl: appendPhotoSignature(item.photoUrl as string | null),
            label: item.label as string | null,
            extras: item.extras,
            translations: item.translations,
          })),
        })),
    })),
  };
}
