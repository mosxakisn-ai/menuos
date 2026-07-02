"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  Info,
  ListChecks,
  Sparkles,
} from "lucide-react";
import type { MenuImportIssue, MenuImportReviewReport } from "@/lib/menu-import-review";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function IssueIcon({ severity }: { severity: MenuImportIssue["severity"] }) {
  if (severity === "error") return <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />;
  return <Info className="h-4 w-4 shrink-0 text-brand-blue" />;
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "emerald" | "amber" | "slate";
}) {
  const accents = {
    blue: "border-brand-blue/20 bg-brand-blue/5 text-brand-blue",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={cn("rounded-card border px-4 py-3", accents[accent ?? "slate"])}>
      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{value}</p>
      {sub ? <p className="mt-0.5 text-xs opacity-75">{sub}</p> : null}
    </div>
  );
}

export function MenuImportReviewReport({
  report,
  copy,
  ocrPagesUsed,
  extraction,
  visionAvailable,
  visionRetrying,
  onVisionRetry,
}: {
  report: MenuImportReviewReport;
  copy: {
    reportTitle: string;
    reportSubtitle: string;
    statCategories: string;
    statCategoriesSub: (withItems: number, empty: number) => string;
    statItems: string;
    statItemsSub: (selected: number) => string;
    statPrices: string;
    statPricesSub: (without: number) => string;
    statReady: string;
    statReadyYes: string;
    statReadyNo: string;
    issuesTitle: string;
    issuesNone: string;
    ocrBadge: (n: number) => string;
      extractionPath: {
        digital: string;
        ocr: string;
        hybrid: string;
        vision: string;
      };
      visionUsedBadge: (n: number) => string;
      visionHint: string;
      visionHintUnavailable: string;
      visionRetryButton: string;
      visionRetrying: string;
    nextStepsTitle: string;
    nextSteps: string[];
  };
  ocrPagesUsed?: number;
  extraction?: {
    path: "digital" | "ocr" | "hybrid" | "vision";
    confidence: number;
    suggestsVision: boolean;
    visionUsed?: boolean;
    visionPages?: number;
  };
  visionAvailable?: boolean;
  visionRetrying?: boolean;
  onVisionRetry?: () => void;
}) {
  const { totals, issues, canImport } = report;
  const actionableIssues = issues.filter((i) => i.severity !== "info");

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-brand-blue/15 p-0">
        <div className="border-b border-brand-blue/10 bg-brand-blue/[0.04] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
                {copy.reportTitle}
              </p>
              <h3 className="mt-1 font-serif text-xl font-bold text-brand-navy">{copy.reportSubtitle}</h3>
            </div>
            {extraction ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {copy.extractionPath[extraction.path]}
              </span>
            ) : null}
            {extraction?.visionUsed && extraction.visionPages ? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                {copy.visionUsedBadge(extraction.visionPages)}
              </span>
            ) : null}
            {ocrPagesUsed && ocrPagesUsed > 0 ? (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                {copy.ocrBadge(ocrPagesUsed)}
              </span>
            ) : null}
          </div>
          {extraction?.suggestsVision && !extraction.visionUsed ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-sm text-amber-900">
                {visionAvailable ? copy.visionHint : copy.visionHintUnavailable}
              </p>
              {visionAvailable && onVisionRetry ? (
                <button
                  type="button"
                  onClick={onVisionRetry}
                  disabled={visionRetrying}
                  className={buttonClass("secondary", "sm")}
                >
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  {visionRetrying ? copy.visionRetrying : copy.visionRetryButton}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={copy.statCategories}
            value={totals.categoriesFound}
            sub={copy.statCategoriesSub(totals.categoriesWithItems, totals.emptyCategories)}
            accent="blue"
          />
          <StatTile
            label={copy.statItems}
            value={totals.itemsFound}
            sub={copy.statItemsSub(totals.itemsSelected)}
            accent="emerald"
          />
          <StatTile
            label={copy.statPrices}
            value={totals.withPrice}
            sub={copy.statPricesSub(totals.withoutPrice)}
            accent={totals.withoutPrice > 0 ? "amber" : "emerald"}
          />
          <StatTile
            label={copy.statReady}
            value={canImport ? copy.statReadyYes : copy.statReadyNo}
            accent={canImport ? "emerald" : "amber"}
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-brand-blue" />
            <h4 className="font-semibold text-brand-navy">{copy.issuesTitle}</h4>
          </div>
          {actionableIssues.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {copy.issuesNone}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {actionableIssues.map((issue) => (
                <li
                  key={issue.id}
                  className={cn(
                    "rounded-button border px-3 py-2.5 text-sm",
                    issue.severity === "error" && "border-red-200 bg-red-50/80 text-red-900",
                    issue.severity === "warning" && "border-amber-200 bg-amber-50/80 text-amber-950",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <IssueIcon severity={issue.severity} />
                    <div>
                      <p>{issue.message}</p>
                      {issue.hint ? <p className="mt-1 text-xs opacity-80">{issue.hint}</p> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand-blue" />
            <h4 className="font-semibold text-brand-navy">{copy.nextStepsTitle}</h4>
          </div>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            {copy.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      </div>

      {issues.some((i) => i.severity === "info") ? (
        <ul className="space-y-2">
          {issues
            .filter((i) => i.severity === "info")
            .map((issue) => (
              <li
                key={issue.id}
                className="flex items-start gap-2 rounded-card border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-950"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>{issue.message}</p>
                  {issue.hint ? <p className="mt-1 text-xs text-violet-800/90">{issue.hint}</p> : null}
                </div>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
