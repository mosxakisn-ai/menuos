"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { formatGeminiTokenCount } from "@/lib/gemini-usage-service";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";
import { cn } from "@/lib/utils";

function formatGeminiCell(row: SupervisorOrganizationRow): string {
  const used = formatGeminiTokenCount(row.geminiTokensThisMonth);
  if (row.geminiTokenLimit === null) return `${used} / ∞`;
  const limit = formatGeminiTokenCount(row.geminiTokenLimit);
  return `${used} / ${limit}`;
}

function usageTone(row: SupervisorOrganizationRow): string {
  if (row.geminiTokenLimit === null) return "text-slate-600";
  if (row.geminiTokensThisMonth >= row.geminiTokenLimit) return "font-semibold text-red-600";
  if (row.geminiTokensThisMonth >= row.geminiTokenLimit * 0.85) return "font-semibold text-amber-700";
  return "text-slate-600";
}

export function SupervisorGeminiClient() {
  const [rows, setRows] = useState<SupervisorOrganizationRow[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/supervisor/organizations", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { organizations: SupervisorOrganizationRow[] };
      const orgs = data.organizations
        .filter((row) => !row.isDemo)
        .sort((a, b) => b.geminiTokensThisMonth - a.geminiTokensThisMonth);
      setRows(orgs);
      setTotalTokens(orgs.reduce((sum, row) => sum + row.geminiTokensThisMonth, 0));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardPage wide>
      <DashboardPageHeader
        title="Gemini AI"
        description="Μηνιαία χρήση tokens ανά πελάτη — PDF import (vision + μετάφραση)."
      />

      <Card className="border-brand-blue/15 bg-gradient-to-br from-brand-blue/[0.04] to-cyan-500/[0.06] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Sparkles className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Τρέχων μήνας (UTC)</p>
            <p className="mt-1 font-serif text-3xl font-bold tabular-nums text-brand-navy">
              {loading ? "…" : formatGeminiTokenCount(totalTokens)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Σύνολο tokens όλων των πελατών · όριο Pro: 500k/μήνα · Enterprise: απεριόριστο
            </p>
          </div>
        </div>
      </Card>

      {error ? (
        <p className="mt-4 text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="mt-4 text-sm text-slate-500">Φόρτωση…</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-brand-surface text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Πελάτης</th>
                <th className="px-4 py-3">Πακέτο</th>
                <th className="px-4 py-3">Tokens (μήνας)</th>
                <th className="px-4 py-3">Override</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-brand-blue/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-navy">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.adminEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.plan}</td>
                  <td className={cn("px-4 py-3 tabular-nums", usageTone(row))}>{formatGeminiCell(row)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.geminiTokenLimitOverride != null
                      ? formatGeminiTokenCount(row.geminiTokenLimitOverride)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/supervisor/organizations" className="text-sm font-semibold text-brand-blue hover:underline">
                      Πελάτες
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPage>
  );
}
