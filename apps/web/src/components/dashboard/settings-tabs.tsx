"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

export const SETTINGS_TAB_IDS = [
  "venue",
  "general",
  "staff",
  "spaces",
  "posts",
  "messages",
  "tables",
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

/** Always available — branding + account. */
export const SETTINGS_FREE_TAB_IDS = ["venue", "general"] as const;

/** Live 360° setup tabs — Pro only. */
export const SETTINGS_LIVE360_TAB_IDS = [
  "staff",
  "spaces",
  "posts",
  "messages",
  "tables",
] as const;

export function isSettingsTabLocked(tabId: SettingsTabId, live360Enabled: boolean): boolean {
  return (
    !live360Enabled &&
    (SETTINGS_LIVE360_TAB_IDS as readonly string[]).includes(tabId)
  );
}

const LEGACY_TAB_REDIRECTS: Record<string, SettingsTabId> = {
  waiters: "staff",
  personnel: "staff",
  services: "staff",
  links: "staff",
  kitchen: "staff",
  bar: "staff",
  cold: "staff",
  dessert: "staff",
  spots: "tables",
  seats: "tables",
  zones: "spaces",
};

function resolveSettingsTab(value: string | null, allowedTabs: readonly SettingsTabId[]): SettingsTabId {
  if (value) {
    const legacy = LEGACY_TAB_REDIRECTS[value];
    if (legacy && allowedTabs.includes(legacy)) return legacy;
    if (allowedTabs.includes(value as SettingsTabId)) return value as SettingsTabId;
  }
  return allowedTabs[0] ?? "general";
}

export function SettingsTabs({
  children,
  allowedTabs = SETTINGS_TAB_IDS,
  live360Enabled = true,
}: {
  children: (tab: SettingsTabId) => React.ReactNode;
  allowedTabs?: readonly SettingsTabId[];
  live360Enabled?: boolean;
}) {
  const { d } = useDashboardCopy();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const activeTab: SettingsTabId = resolveSettingsTab(raw, allowedTabs);
  const tabs = d.pages.settings.tabs;

  const selectTab = useCallback(
    (id: SettingsTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      const defaultTab = allowedTabs[0] ?? "general";
      if (id === defaultTab) params.delete("tab");
      else params.set("tab", id);
      const qs = params.toString();
      router.replace(qs ? `/dashboard/settings?${qs}` : "/dashboard/settings", { scroll: false });
    },
    [router, searchParams, allowedTabs],
  );

  return (
    <div className="space-y-5">
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 pb-px"
        aria-label={d.pages.settings.title}
      >
        {allowedTabs.map((id) => {
          const selected = activeTab === id;
          const locked = isSettingsTabLocked(id, live360Enabled);
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (locked) return;
                selectTab(id);
              }}
              aria-selected={selected}
              aria-disabled={locked}
              title={locked ? d.nav.proOnlyBadge : undefined}
              role="tab"
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-button border-b-2 px-3 py-2.5 text-sm font-medium transition",
                locked
                  ? "cursor-not-allowed text-slate-400 hover:text-slate-500"
                  : selected
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-slate-600 hover:border-slate-200 hover:text-brand-navy",
              )}
            >
              {locked ? <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
              {tabs[id]}
              {locked ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  {d.nav.proOnlyBadge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div role="tabpanel">{children(activeTab)}</div>
    </div>
  );
}
