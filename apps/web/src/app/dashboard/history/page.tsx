import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { PassSignalHistoryPanel } from "@/components/dashboard/pass-signal-history-panel";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { Live360FeatureGate } from "@/components/dashboard/live360-feature-gate";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { getSession } from "@/lib/auth";
import { organizationHasLive360 } from "@/lib/billing";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("history", "/dashboard/history");
}

export default async function HistoryPage() {
  const session = await getSession();
  if (session!.role === "STAFF") redirect("/dashboard/waiter");
  const live360Enabled = await organizationHasLive360(session!.organizationId);
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage wide>
      <LocalizedDashboardPageHeader page="history" />
      <Live360FeatureGate enabled={live360Enabled}>
        <PassSignalHistoryPanel venues={venues} />
      </Live360FeatureGate>
    </DashboardPage>
  );
}
