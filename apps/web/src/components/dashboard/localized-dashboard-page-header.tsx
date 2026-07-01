"use client";

import { useEffect } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type DashboardPageKey = keyof ReturnType<typeof useDashboardCopy>["d"]["pages"];
type DashboardMetaKey = keyof ReturnType<typeof useDashboardCopy>["d"]["meta"];

export function LocalizedDashboardPageHeader({ page }: { page: DashboardPageKey }) {
  const { d } = useDashboardCopy();
  const copy = d.pages[page];
  const metaKey = page as DashboardMetaKey;
  useDashboardDocumentTitle(metaKey in d.meta ? metaKey : undefined, copy.title);
  return <DashboardPageHeader title={copy.title} description={copy.description} />;
}

export function LocalizedSettingsPageHeader() {
  const { d } = useDashboardCopy();
  useDashboardDocumentTitle("settings", d.pages.settings.title);
  return (
    <DashboardPageHeader title={d.pages.settings.title} description={d.pages.settings.description} />
  );
}

export function useDashboardDocumentTitle(metaKey?: DashboardMetaKey, fallbackTitle?: string) {
  const { d } = useDashboardCopy();
  useEffect(() => {
    const title = metaKey ? d.meta[metaKey] : fallbackTitle;
    if (!title) return;
    document.title = `${title} | ${d.meta.appSuffix}`;
  }, [d.meta, fallbackTitle, metaKey]);
}

export function DashboardDocumentTitle({ page }: { page: DashboardMetaKey }) {
  useDashboardDocumentTitle(page);
  return null;
}
