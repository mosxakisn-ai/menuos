"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { buildMenusPageUrl } from "@/lib/menus-nav-url";

function BackLink({ href, label }: { href: string; label: string }) {
  const text = label.replace(/^←\s*/, "");

  return (
    <Link
      href={href}
      className="group mb-4 inline-flex items-center gap-2 rounded-button border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-blue/30 hover:bg-brand-blue/[0.04] hover:text-brand-blue"
    >
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
      {text}
    </Link>
  );
}

export function UpgradeReasonBanner() {
  const { d } = useDashboardCopy();
  const searchParams = useSearchParams();
  const reason = searchParams.get("upgrade");
  const catalogBackHref = buildMenusPageUrl({
    venueId: searchParams.get("venue") ?? undefined,
    menuId: searchParams.get("menu") ?? undefined,
  });

  if (reason === "pdf-import") {
    return (
      <div className="overflow-hidden rounded-card border border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.06] via-white to-cyan-50/40 px-5 py-5 text-sm text-brand-navy shadow-sm">
        <BackLink href={catalogBackHref} label={d.pages.import.backToCatalog} />
        <p className="font-semibold">{d.upgrade.whyHere}</p>
        <p className="mt-2 leading-relaxed text-slate-700">{d.upgrade.pdfImport}</p>
        <a href="#plans" className={`mt-4 inline-flex ${buttonClass("primary", "sm")}`}>
          {d.upgrade.pdfImportCta}
        </a>
      </div>
    );
  }

  if (reason === "live-360") {
    return (
      <div className="overflow-hidden rounded-card border border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.06] via-white to-cyan-50/40 px-5 py-5 text-sm text-brand-navy shadow-sm">
        <BackLink href="/dashboard" label={d.proFeature.live360.back} />
        <p className="font-semibold">{d.upgrade.whyHere}</p>
        <p className="mt-2 leading-relaxed text-slate-700">{d.upgrade.live360}</p>
        <a href="#plans" className={`mt-4 inline-flex ${buttonClass("primary", "sm")}`}>
          {d.upgrade.live360Cta}
        </a>
      </div>
    );
  }

  return null;
}
