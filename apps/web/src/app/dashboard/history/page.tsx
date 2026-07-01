import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { PassSignalHistoryPanel } from "@/components/dashboard/pass-signal-history-panel";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { getSession } from "@/lib/auth";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("history", "/dashboard/history");
}

export default async function HistoryPage() {
  const session = await getSession();
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage>
      <LocalizedDashboardPageHeader page="history" />
      <PassSignalHistoryPanel venues={venues} />
    </DashboardPage>
  );
}
