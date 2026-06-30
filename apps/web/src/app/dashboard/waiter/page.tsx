import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
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
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Κλήσεις σερβιτόρου</h1>
        <p className="text-sm text-slate-600">
          Οι πελάτες καλούν από το QR menu. Ενημερώνεται αυτόματα — και μπορείς να λαμβάνεις ειδοποίηση στο κινητό.
        </p>
      </div>
      <PushNotificationsPrompt />
      <WaiterPanel venues={venues} initialVenueId={sp.venue} />
    </div>
  );
}
