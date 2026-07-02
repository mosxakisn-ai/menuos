"use client";

import Link from "next/link";
import { LocalizedDashboardPageHeader, DashboardDocumentTitle } from "@/components/dashboard/localized-dashboard-page-header";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buildMenusPageUrl } from "@/lib/menus-nav-url";

export function MenuImportPageIntro({
  venueId,
  menuId,
}: {
  venueId?: string;
  menuId?: string;
}) {
  const { d } = useDashboardCopy();
  const href = buildMenusPageUrl({ venueId, menuId });

  return (
    <div className="space-y-4">
      <DashboardDocumentTitle page="import" />
      <Link href={href} className="text-sm text-brand-blue hover:underline">
        {d.pages.import.backToCatalog}
      </Link>
      <LocalizedDashboardPageHeader page="import" />
    </div>
  );
}
