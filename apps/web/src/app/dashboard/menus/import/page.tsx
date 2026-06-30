import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { MenuImportWizard } from "@/components/dashboard/menu-import-wizard";
import { getSession } from "@/lib/auth";
import { getOrganizationPlanContext, organizationCanUsePdfImport } from "@/lib/billing";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata(
  "Import από PDF",
  "/dashboard/menus/import",
);

type Props = { searchParams: Promise<{ venue?: string }> };

export default async function MenuImportPage({ searchParams }: Props) {
  const session = await getSession();
  const planCtx = await getOrganizationPlanContext(session!.organizationId);
  if (!planCtx || !organizationCanUsePdfImport(planCtx.planId)) {
    redirect("/dashboard/billing?upgrade=pdf-import");
  }

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
        ← Πίσω στον κατάλογο
      </Link>
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Εισαγωγή από PDF</h1>
        <p className="text-sm text-slate-600">
          Ανέβασε PDF menu — ελέγχεις τα αποτελέσματα πριν τα αποθηκεύσεις στον κατάλογο.
        </p>
      </div>
      <MenuImportWizard venues={venues} initialVenueId={sp.venue} />
    </div>
  );
}
