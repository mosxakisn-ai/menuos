import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@menuos/db";
import { MenuEditor } from "@/components/dashboard/menu-editor";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { getSession } from "@/lib/auth";
import { getOrganizationPlanContext, organizationCanUsePdfImport } from "@/lib/billing";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("menus", "/dashboard/menus");
}

type Props = { searchParams: Promise<{ venue?: string; menu?: string; welcome?: string }> };

export default async function MenusPage({ searchParams }: Props) {
  const session = await getSession();
  if (session!.role === "STAFF") redirect("/dashboard/waiter");
  const sp = await searchParams;
  const planCtx = await getOrganizationPlanContext(session!.organizationId);
  const canImportPdf = planCtx ? organizationCanUsePdfImport(planCtx.planId) : false;
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage wide>
      <LocalizedDashboardPageHeader page="menus" />
      <Suspense fallback={null}>
        <MenuEditor
          venues={venues}
          initialVenueId={sp.venue}
          welcome={sp.welcome === "1"}
          canImportPdf={canImportPdf}
        />
      </Suspense>
    </DashboardPage>
  );
}
