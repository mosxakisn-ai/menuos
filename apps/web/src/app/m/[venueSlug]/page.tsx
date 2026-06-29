import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma, SupportedLanguage } from "@menuos/db";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { PublicMenuView } from "@/components/menu/public-menu-view";

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
  const lang = parseLang(sp.lang);

  const venue = await prisma.venue.findUnique({
    where: { slug: venueSlug },
    include: {
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

  return (
    <PublicMenuView
      venue={venue}
      language={lang}
      tableNumber={sp.table}
      roomNumber={sp.room}
    />
  );
}

function parseLang(raw?: string): SupportedLanguage {
  const map: Record<string, SupportedLanguage> = {
    gr: "GR",
    el: "GR",
    en: "EN",
    de: "DE",
    fr: "FR",
  };
  return map[raw?.toLowerCase() ?? ""] ?? "GR";
}
