import { prisma } from "@menuos/db";

export async function getVenueForOrganization(venueId: string, organizationId: string) {
  return prisma.venue.findFirst({
    where: { id: venueId, organizationId },
    include: { settings: true, menus: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function listVenuesForOrganization(organizationId: string) {
  return prisma.venue.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      menus: {
        include: {
          _count: { select: { categories: true } },
        },
      },
      _count: { select: { waiterCalls: true } },
    },
  });
}

export async function getMenuForOrganization(menuId: string, organizationId: string) {
  return prisma.menu.findFirst({
    where: { id: menuId, venue: { organizationId } },
    include: { venue: true },
  });
}

export async function getCategoryForOrganization(categoryId: string, organizationId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, menu: { venue: { organizationId } } },
    include: { menu: { include: { venue: true } } },
  });
}

export async function getItemForOrganization(itemId: string, organizationId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, category: { menu: { venue: { organizationId } } } },
    include: {
      translations: true,
      category: { include: { menu: { include: { venue: true } } } },
    },
  });
}
