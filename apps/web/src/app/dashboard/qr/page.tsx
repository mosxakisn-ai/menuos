import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { VenueSpotsManager } from "@/components/dashboard/venue-spots-manager";
import { MarkQrOnboarding } from "@/components/dashboard/mark-qr-onboarding";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Κωδικοί QR", "/dashboard/qr");

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
      <DashboardPageHeader
        title="QR Codes"
        description="Πρόσθεσε τραπέζια, δωμάτια ή ξαπλώστρες και κατέβασε QR για κάθε θέση. Ο σερβιτόρος βλέπει τον αριθμό στην κλήση."
      />
      <VenueSpotsManager venues={venueList} initialVenueId={sp.venue} itemCountByVenue={itemCountByVenue} />
    </DashboardPage>
  );
}
