import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { Live360FeatureGate } from "@/components/dashboard/live360-feature-gate";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { SubscriptionInactiveBanner } from "@/components/dashboard/subscription-inactive-banner";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { getSession } from "@/lib/auth";
import { organizationHasLive360 } from "@/lib/billing";
import { getOrganizationNotificationSettings } from "@/lib/organization-notification-settings";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("waiter", "/dashboard/waiter");
}

type Props = { searchParams: Promise<{ venue?: string; inactive?: string }> };

export default async function WaiterPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const live360Enabled = await organizationHasLive360(session!.organizationId);
  const showInactiveBanner = sp.inactive === "1" && session!.role === "STAFF";
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  const notificationSettings = await getOrganizationNotificationSettings(session!.organizationId);

  return (
    <DashboardPage wide>
      <LocalizedDashboardPageHeader page="waiter" />
      {showInactiveBanner ? (
        <div className="mb-6">
          <SubscriptionInactiveBanner show staffMode subscription={null} />
        </div>
      ) : null}
      <Live360FeatureGate enabled={live360Enabled} staffMode={session!.role === "STAFF"}>
        <WaiterPanel
          venues={venues}
          initialVenueId={
            sp.venue && venues.some((v) => v.id === sp.venue) ? sp.venue : undefined
          }
          notificationSettings={notificationSettings}
        />
      </Live360FeatureGate>
    </DashboardPage>
  );
}
