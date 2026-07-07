import { prisma } from "@menuos/db";
import { appendPhotoSignature } from "@/lib/photo-signing";

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

export function toPublicVenuePayload(
  venue: NonNullable<Awaited<ReturnType<typeof loadPublicVenueMenu>>>,
) {
  return {
    name: venue.name,
    slug: venue.slug,
    logoUrl: appendPhotoSignature(venue.logoUrl),
    primaryColor: venue.primaryColor,
    description: venue.description,
    cuisineType: venue.cuisineType,
    menus: venue.menus.map((menu) => ({
      ...menu,
      categories: menu.categories
        .filter((category) => category.items.length > 0)
        .map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            photoUrl: appendPhotoSignature(item.photoUrl),
          })),
        })),
    })),
  };
}
