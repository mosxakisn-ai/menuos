"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";

export function PlanLimitHint({
  message,
  upgradeHref = "/dashboard/billing",
  className = "",
}: {
  message: string;
  upgradeHref?: string;
  className?: string;
}) {
  const { d } = useDashboardCopy();

  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 px-4 py-3.5 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="leading-relaxed">{message}</p>
      </div>
      <Link href={upgradeHref} className={`inline-flex shrink-0 ${buttonClass("primary", "sm")}`}>
        {d.planLimits.seePlans}
      </Link>
    </div>
  );
}
