"use client";

import { DashboardScrollRow } from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

type MenuOption = { id: string; name: string };

export function CatalogPills({
  menus,
  activeMenuId,
  onSelect,
  className,
}: {
  menus: MenuOption[];
  activeMenuId: string;
  onSelect: (menuId: string) => void;
  className?: string;
}) {
  if (menus.length === 0) return null;

  return (
    <DashboardScrollRow className={className} innerClassName="flex gap-2 pb-0.5">
      {menus.map((m) => {
        const isActive = m.id === activeMenuId;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            aria-pressed={isActive}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
              isActive
                ? "bg-brand-gradient text-white shadow-glow"
                : "bg-brand-surface text-brand-navy ring-1 ring-slate-200/90 hover:ring-brand-blue/40",
            )}
          >
            {m.name}
          </button>
        );
      })}
    </DashboardScrollRow>
  );
}
