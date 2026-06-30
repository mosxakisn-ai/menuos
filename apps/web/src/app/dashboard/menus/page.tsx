import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { MenuEditor } from "@/components/dashboard/menu-editor";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getOrganizationPlanContext, organizationCanUsePdfImport } from "@/lib/billing";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Κατάλογος", "/dashboard/menus");

type Props = { searchParams: Promise<{ venue?: string; welcome?: string }> };

export default async function MenusPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const planCtx = await getOrganizationPlanContext(session!.organizationId);
  const canImportPdf = planCtx ? organizationCanUsePdfImport(planCtx.planId) : false;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary">Κατάλογος</h1>
          <p className="text-sm text-slate-600">
            Πρόσθεσε κατηγορίες και πιάτα — υποστηρίζονται 4 γλώσσες στο QR menu (ΕΛ, EN, DE, FR).
          </p>
        </div>
        {canImportPdf ? (
          <Link
            href={`/dashboard/menus/import${sp.venue ? `?venue=${sp.venue}` : ""}`}
            className={buttonClass("secondary", "sm")}
          >
            Εισαγωγή από PDF
          </Link>
        ) : (
          <Link href="/dashboard/billing?upgrade=pdf-import" className={buttonClass("secondary", "sm")}>
            Εισαγωγή PDF (μόνο Pro)
          </Link>
        )}
      </div>
      <MenuEditor
        venues={venues}
        initialVenueId={sp.venue}
        welcome={sp.welcome === "1"}
        canImportPdf={canImportPdf}
      />
    </div>
  );
}
