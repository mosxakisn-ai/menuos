import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { WaiterPanel } from "@/components/dashboard/waiter-panel";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Κλήσεις σερβιτόρου", "/dashboard/waiter");

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function WaiterPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true, staffToken: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Κλήσεις σερβιτόρου"
        description="Οι πελάτες καλούν από το QR menu. Ενημερώνεται αυτόματα. Στείλε το link στο κινητό του σερβιτόρου — χωρίς login — και ενεργοποίησε ειδοποιήσεις εκεί."
      />
      <PushNotificationsPrompt />
      <WaiterPanel
        venues={venues}
        initialVenueId={
          sp.venue && venues.some((v) => v.id === sp.venue) ? sp.venue : undefined
        }
      />
    </DashboardPage>
  );
}
