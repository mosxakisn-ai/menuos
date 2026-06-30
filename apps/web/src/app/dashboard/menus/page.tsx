import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { MenuEditor } from "@/components/dashboard/menu-editor";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Menus", "/dashboard/menus");

type Props = { searchParams: Promise<{ venue?: string; welcome?: string }> };

export default async function MenusPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Menus</h1>
        <p className="text-sm text-slate-600">
          Πρόσθεσε κατηγορίες και πιάτα στα Ελληνικά — και προαιρετικά Αγγλικά για τουρίστες.
        </p>
      </div>
      <MenuEditor venues={venues} initialVenueId={sp.venue} welcome={sp.welcome === "1"} />
    </div>
  );
}
