"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";

export function OnboardingQrHint() {
  const { d } = useDashboardCopy();

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.06] via-white to-cyan-50/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-slate-700">{d.onboarding.qrPageHint}</p>
      <Link
        href="/dashboard"
        className={`inline-flex shrink-0 items-center gap-2 ${buttonClass("primary", "sm")}`}
      >
        <ArrowLeft className="h-4 w-4" />
        {d.onboarding.backToGuide}
      </Link>
    </div>
  );
}
