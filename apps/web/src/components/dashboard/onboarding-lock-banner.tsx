"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export function OnboardingLockBanner({ stepIndex }: { stepIndex: number }) {
  const { d } = useDashboardCopy();
  const O = d.onboarding;
  const label = O.stepLabels[stepIndex] ?? O.stepLabels[0]!;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
    >
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{O.lockBanner(stepIndex + 1, label)}</p>
        <p className="mt-1 text-xs text-amber-800/90">{O.guideIntro}</p>
      </div>
      <Link
        href="/dashboard"
        className="shrink-0 rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100/60"
      >
        {O.backToGuide}
      </Link>
    </div>
  );
}
