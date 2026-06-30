import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { MenuImportWizard } from "@/components/dashboard/menu-import-wizard";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata(
  "Import από PDF",
  "/dashboard/menus/import",
);

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function MenuImportPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: {
      id: true,
      name: true,
      menus: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/menus${sp.venue ? `?venue=${sp.venue}` : ""}`} className="text-sm text-brand-blue hover:underline">
        ← Πίσω στο Menu
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Import από PDF</h1>
        <p className="text-sm text-slate-600">
          Ανέβασε τα menu PDF σου — ελέγχεις τα αποτελέσματα πριν τα αποθηκεύσεις.
        </p>
      </div>
      <MenuImportWizard venues={venues} initialVenueId={sp.venue} />
    </div>
  );
}
