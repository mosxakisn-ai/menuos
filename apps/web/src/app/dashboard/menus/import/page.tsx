import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { MenuImportPageIntro } from "@/components/dashboard/menu-import-page-intro";
import { MenuImportWizard } from "@/components/dashboard/menu-import-wizard";
import { getSession } from "@/lib/auth";
import { getOrganizationPlanContext, organizationCanUsePdfImport } from "@/lib/billing";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata(
  "Import from PDF",
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
    <DashboardPage>
      <MenuImportPageIntro venueId={sp.venue} />
      <MenuImportWizard venues={venues} initialVenueId={sp.venue} />
    </DashboardPage>
  );
}
