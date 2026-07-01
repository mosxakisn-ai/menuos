import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { VenueSpotsQrList } from "@/components/dashboard/venue-spots-qr-list";
import { MarkQrOnboarding } from "@/components/dashboard/mark-qr-onboarding";
import { getSession } from "@/lib/auth";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("qr", "/dashboard/qr");
}

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function QrPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      menus: { select: { categories: { select: { items: { select: { id: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const itemCountByVenue = Object.fromEntries(
    venues.map((v) => [
      v.id,
      v.menus.reduce(
        (n, m) => n + m.categories.reduce((c, cat) => c + cat.items.length, 0),
        0,
      ),
    ]),
  );

  const venueList = venues.map(({ id, name, slug }) => ({ id, name, slug }));

  return (
    <DashboardPage>
      <MarkQrOnboarding />
      <LocalizedDashboardPageHeader page="qr" />
      <VenueSpotsQrList venues={venueList} initialVenueId={sp.venue} itemCountByVenue={itemCountByVenue} />
    </DashboardPage>
  );
}
