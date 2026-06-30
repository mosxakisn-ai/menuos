import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@menuos/db";
import { parseQrMenuLanguage } from "@menuos/shared";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { organizationIsPubliclyActive } from "@/lib/organization-access";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";

type Props = {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<{ table?: string; room?: string; lang?: string }>;
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
    return <PublicMenuUnavailable venueName={venue.name} />;
  }

  return (
    <PublicMenuView
      venue={venue}
      language={lang}
      tableNumber={sp.table}
      roomNumber={sp.room}
    />
  );
}
