"use client";

import Link from "next/link";
import { LocalizedDashboardPageHeader, DashboardDocumentTitle } from "@/components/dashboard/localized-dashboard-page-header";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export function MenuImportPageIntro({ venueId }: { venueId?: string }) {
  const { d } = useDashboardCopy();
  const href = `/dashboard/menus${venueId ? `?venue=${venueId}` : ""}`;

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
