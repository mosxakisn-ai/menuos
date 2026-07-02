import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { getSession } from "@/lib/auth";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("waiter", "/dashboard/waiter");
}

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function WaiterPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage>
      <LocalizedDashboardPageHeader page="waiter" />
      <WaiterPanel
        venues={venues}
        initialVenueId={
          sp.venue && venues.some((v) => v.id === sp.venue) ? sp.venue : undefined
        }
      />
    </DashboardPage>
  );
}
