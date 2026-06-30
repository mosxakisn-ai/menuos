import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { MenuEditor } from "@/components/dashboard/menu-editor";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
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
    <DashboardPage>
      <DashboardPageHeader
        title="Κατάλογος"
        description="Πρόσθεσε κατηγορίες και πιάτα — υποστηρίζονται πολλαπλές γλώσσες στο QR menu."
        action={
          canImportPdf ? (
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
          )
        }
      />
      <MenuEditor
        venues={venues}
        initialVenueId={sp.venue}
        welcome={sp.welcome === "1"}
        canImportPdf={canImportPdf}
      />
    </DashboardPage>
  );
}
