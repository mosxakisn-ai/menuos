"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";

export function UpgradeReasonBanner() {
  const { d } = useDashboardCopy();
  const reason = useSearchParams().get("upgrade");

  if (reason === "pdf-import") {
    return (
      <div className="rounded-card border border-brand-blue/20 bg-brand-blue/5 px-4 py-4 text-sm text-brand-navy">
        <p className="font-semibold">{d.upgrade.whyHere}</p>
        <p className="mt-2 leading-relaxed text-slate-700">{d.upgrade.pdfImport}</p>
        <a href="#plans" className={`mt-3 inline-flex ${buttonClass("primary", "sm")}`}>
          {d.upgrade.pdfImportCta}
        </a>
      </div>
    );
  }

  return null;
}
