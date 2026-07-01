"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

export const SETTINGS_TAB_IDS = [
  "general",
  "personnel",
  "kitchen",
  "bar",
  "tables",
  "services",
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

function resolveSettingsTab(value: string | null): SettingsTabId {
  if (value === "waiters") return "services";
  if (value && SETTINGS_TAB_IDS.includes(value as SettingsTabId)) {
    return value as SettingsTabId;
  }
  return "general";
}

export function SettingsTabs({ children }: { children: (tab: SettingsTabId) => React.ReactNode }) {
  const { d } = useDashboardCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const activeTab: SettingsTabId = resolveSettingsTab(raw);
  const tabs = d.pages.settings.tabs;

  const selectTab = useCallback(
    (id: SettingsTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "general") params.delete("tab");
      else params.set("tab", id);
      const qs = params.toString();
      router.replace(qs ? `/dashboard/settings?${qs}` : "/dashboard/settings", { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-5">
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 pb-px"
        aria-label={d.pages.settings.title}
      >
        {SETTINGS_TAB_IDS.map((id) => {
          const selected = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              aria-selected={selected}
              role="tab"
              className={cn(
                "shrink-0 whitespace-nowrap rounded-t-button border-b-2 px-3 py-2.5 text-sm font-medium transition",
                selected
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:text-brand-navy",
              )}
            >
              {tabs[id]}
            </button>
          );
        })}
      </nav>
      <div role="tabpanel">{children(activeTab)}</div>
    </div>
  );
}
