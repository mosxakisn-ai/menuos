import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@menuos/db";
import { parseQrMenuLanguage } from "@menuos/shared";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { appendPhotoSignature } from "@/lib/photo-signing";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ table?: string; room?: string; sunbed?: string; lang?: string; embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { venueSlug } = await params;
  return buildPrivatePageMetadata(`Menu — ${venueSlug}`, `/m/${venueSlug}`);
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

  return (
    <PublicMenuView
      venue={publicVenue}
      language={lang}
      tableNumber={trimParam(sp.table)}
      roomNumber={trimParam(sp.room)}
      sunbedNumber={trimParam(sp.sunbed)}
      embedMode={sp.embed === "1"}
    />
  );
}
