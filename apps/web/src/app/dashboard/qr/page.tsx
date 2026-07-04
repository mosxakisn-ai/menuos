import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { QrPageHeader } from "@/components/dashboard/qr-page-header";
import { VenueCatalogQr } from "@/components/dashboard/venue-catalog-qr";
import { VenueSpotsQrList } from "@/components/dashboard/venue-spots-qr-list";
import { MarkQrOnboarding } from "@/components/dashboard/mark-qr-onboarding";
import { getSession } from "@/lib/auth";
import { organizationHasLive360 } from "@/lib/billing";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("qr", "/dashboard/qr");
}

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function QrPage({ searchParams }: Props) {
  const session = await getSession();
  if (session!.role === "STAFF") redirect("/dashboard/waiter");
  const sp = await searchParams;
  const proQrMode = await organizationHasLive360(session!.organizationId);

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
    <DashboardPage wide>
      <MarkQrOnboarding />
      <QrPageHeader proMode={proQrMode} />
      {proQrMode ? (
        <VenueSpotsQrList venues={venueList} initialVenueId={sp.venue} itemCountByVenue={itemCountByVenue} />
      ) : (
        <VenueCatalogQr venues={venueList} initialVenueId={sp.venue} itemCountByVenue={itemCountByVenue} />
      )}
    </DashboardPage>
  );
}
