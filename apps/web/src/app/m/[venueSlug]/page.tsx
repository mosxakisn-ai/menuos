import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@menuos/db";
import { parseQrMenuLanguage, cuisineTypeQrLabel, isCuisineType } from "@menuos/shared";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { organizationCanUseLive360 } from "@/lib/billing";
import { appendPhotoSignature } from "@/lib/photo-signing";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ table?: string; room?: string; sunbed?: string; lang?: string; embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    select: { name: true, description: true, cuisineType: true },
  });
  if (!venue) {
    return buildPrivatePageMetadata(`Menu — ${venueSlug}`, `/m/${venueSlug}`);
  }
  const cuisine =
    venue.cuisineType && isCuisineType(venue.cuisineType)
      ? cuisineTypeQrLabel(venue.cuisineType, "EN")
      : null;
  const title = cuisine ? `${venue.name} — ${cuisine}` : venue.name;
  const description =
    venue.description?.trim() ||
    (cuisine
      ? `${venue.name}: ${cuisine}. Browse the digital menu on your phone.`
      : `${venue.name} — digital menu on MenuOS.`);
  return buildPrivatePageMetadata(title, `/m/${venueSlug}`, description);
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const { venueSlug } = await params;
  const sp = await searchParams;
  const lang = parseQrMenuLanguage(sp.lang);

  const venue = await prisma.venue.findUnique({
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

  if (!venue) notFound();

  if (!organizationIsPubliclyActive(venue.organization.subscription)) {
    return <PublicMenuUnavailable language={lang} />;
  }

  const trimParam = (v?: string) => {
    const t = v?.trim();
    return t || undefined;
  };

  const publicVenue = {
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

  const live360Enabled = organizationCanUseLive360(venue.organization.subscription?.plan ?? "TRIAL");

  return (
    <PublicMenuView
      venue={publicVenue}
      language={lang}
      tableNumber={trimParam(sp.table)}
      roomNumber={trimParam(sp.room)}
      sunbedNumber={trimParam(sp.sunbed)}
      embedMode={sp.embed === "1"}
      live360Enabled={live360Enabled}
    />
  );
}
