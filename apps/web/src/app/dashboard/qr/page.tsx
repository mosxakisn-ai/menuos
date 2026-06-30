import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { QrGenerator } from "@/components/dashboard/qr-generator";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("QR Codes", "/dashboard/qr");

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
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">QR Codes</h1>
        <p className="text-sm text-slate-600">
          Κατέβασε QR για τραπέζια ή δωμάτια. Οι πελάτες σκανάρουν και βλέπουν το live menu.
        </p>
      </div>
      <QrGenerator venues={venueList} initialVenueId={sp.venue} itemCountByVenue={itemCountByVenue} />
    </div>
  );
}
