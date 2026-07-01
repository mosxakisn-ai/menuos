"use client";

import { Globe } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { DashboardLang } from "@/content/dashboard-i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { code: DashboardLang; label: string }[] = [
  { code: "GR", label: "ΕΛ" },
  { code: "EN", label: "EN" },
];

export function DashboardLanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useDashboardCopy();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-white p-0.5 shadow-sm",
        className,
      )}
      role="group"
      aria-label="Dashboard language"
    >
      <Globe className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      {OPTIONS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cn(
            "min-w-[2.25rem] rounded-full px-2 py-1 text-[11px] font-bold tracking-wide transition",
            lang === code
              ? "bg-brand-gradient text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-primary",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
