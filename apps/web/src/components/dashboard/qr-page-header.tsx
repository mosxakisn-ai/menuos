"use client";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import {
  useDashboardDocumentTitle,
} from "@/components/dashboard/localized-dashboard-page-header";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export function QrPageHeader({ proMode }: { proMode: boolean }) {
  const { d } = useDashboardCopy();
  const Q = d.pages.qr;
  useDashboardDocumentTitle("qr", Q.title);
  return (
    <DashboardPageHeader
      title={Q.title}
      description={proMode ? Q.descriptionPro : Q.descriptionBasic}
    />
  );
}
