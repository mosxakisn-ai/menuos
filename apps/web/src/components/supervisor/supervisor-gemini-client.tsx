"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Search, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import {
  DashboardPage,
  DashboardPageHeader,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { formatGeminiTokenCount } from "@/lib/gemini-usage-service";
import type { SupervisorGeminiRow } from "@/lib/supervisor-service";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Δοκιμή",
  BASIC: "Basic",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const STATUS_LABELS: Record<string, string> = {
  TRIALING: "Δοκιμή",
  ACTIVE: "Ενεργή",
  PAST_DUE: "Καθυστέρηση",
  CANCELED: "Ακυρωμένη",
};

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-900 ring-amber-200",
  BASIC: "bg-brand-blue/10 text-brand-blue ring-brand-blue/20",
  PRO: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  ENTERPRISE: "bg-slate-200 text-slate-800 ring-slate-300",
};

function formatLimit(limit: number | null): string {
  if (limit === null) return "Απεριόριστο";
  if (limit === 0) return "0 (χωρίς AI)";
  return formatGeminiTokenCount(limit);
}

function usageTone(row: SupervisorGeminiRow): string {
  if (row.geminiTokenLimit === null) return "text-slate-600";
  if (row.geminiTokenLimit === 0 && row.geminiTokensThisMonth > 0) return "font-semibold text-red-600";
  if (row.geminiTokensThisMonth >= row.geminiTokenLimit) return "font-semibold text-red-600";
  if (row.geminiTokenLimit > 0 && row.geminiTokensThisMonth >= row.geminiTokenLimit * 0.85) {
    return "font-semibold text-amber-700";
  }
  return "text-slate-600";
}

function usagePercent(row: SupervisorGeminiRow): number | null {
  if (row.geminiTokenLimit === null || row.geminiTokenLimit <= 0) return null;
  return Math.min(100, Math.round((row.geminiTokensThisMonth / row.geminiTokenLimit) * 100));
}

function overrideDraftMatchesSaved(row: SupervisorGeminiRow, draft: string): boolean {
  const trimmed = draft.trim();
  const saved =
    row.geminiTokenLimitOverride != null ? String(row.geminiTokenLimitOverride) : "";
  return trimmed === saved;
}

export function SupervisorGeminiClient() {
  const [rows, setRows] = useState<SupervisorGeminiRow[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const res = await fetch("/api/supervisor/gemini", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { customers: SupervisorGeminiRow[]; totalTokens: number };
      const sorted = [...data.customers].sort(
        (a, b) => b.geminiTokensThisMonth - a.geminiTokensThisMonth,
      );
      setRows(sorted);
      setTotalTokens(data.totalTokens);
      setOverrideDraft(
        Object.fromEntries(
          sorted.map((row) => [
            row.id,
            row.geminiTokenLimitOverride != null ? String(row.geminiTokenLimitOverride) : "",
          ]),
        ),
      );
      setLoadError(null);
    } catch {
      if (!opts?.silent) {
        setLoadError("Αποτυχία φόρτωσης. Δοκίμασε ξανά.");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (planFilter && row.plan !== planFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.adminEmail.toLowerCase().includes(q) ||
        row.plan.toLowerCase().includes(q)
      );
    });
  }, [rows, search, planFilter]);

  async function saveOverride(row: SupervisorGeminiRow) {
    const trimmed = (overrideDraft[row.id] ?? "").trim();
    const parsed = trimmed === "" ? null : Number.parseInt(trimmed, 10);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      setActionError("Μη έγκυρο όριο tokens.");
      return;
    }

    setSavingId(row.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/supervisor/organizations/${row.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiTokenLimitOverride: parsed }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Αποτυχία αποθήκευσης.");
      }
      await load({ silent: true });
      setSavedId(row.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Αποτυχία αποθήκευσης.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <DashboardPage wide>
      <DashboardPageHeader
        title="Gemini AI"
        description="Όριο tokens ανά πελάτη για PDF import (vision + μετάφραση). Το default έρχεται από το πακέτο — μπορείς να το αλλάξεις ανά πελάτη."
      />

      <Card className="border-brand-blue/15 bg-gradient-to-br from-brand-blue/[0.04] to-cyan-500/[0.06] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                Τρέχων μήνας (UTC)
              </p>
              <p className="mt-1 font-serif text-3xl font-bold tabular-nums text-brand-navy">
                {loading ? "…" : formatGeminiTokenCount(totalTokens)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Σύνολο tokens · Δοκιμή/Basic: 0 · Pro: 500k · Enterprise: απεριόριστο
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className={cn(buttonClass("secondary", "sm"), "inline-flex items-center gap-2")}
          >
            <RefreshCw className="h-4 w-4" />
            Ανανέωση
          </button>
        </div>
      </Card>

      <Card className="mt-5 grid gap-4 border-brand-blue/10 p-4 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-2">
          <span className={dashboardLabelClass}>Αναζήτηση</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={cn(dashboardFieldClass, "pl-9")}
              placeholder="Επιχείρηση, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Πακέτο</span>
          <select
            className={dashboardFieldClass}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">Όλα</option>
            <option value="TRIAL">Δοκιμή</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </label>
      </Card>

      {loadError ? (
        <Card className="mt-4 border-red-100 bg-red-50/50 p-4">
          <p className="text-sm text-red-700">{loadError}</p>
          <button type="button" className={`mt-3 ${buttonClass("secondary", "sm")}`} onClick={() => void load()}>
            Δοκίμασε ξανά
          </button>
        </Card>
      ) : loading ? (
        <p className="mt-4 text-sm text-slate-500">Φόρτωση πελατών…</p>
      ) : (
        <>
          {actionError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Δεν βρέθηκαν πελάτες.</p>
          ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-brand-surface text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Πελάτης</th>
                <th className="px-4 py-3">Πακέτο</th>
                <th className="px-4 py-3">Χρήση (μήνας)</th>
                <th className="px-4 py-3">Default όριο</th>
                <th className="px-4 py-3">Custom όριο</th>
                <th className="px-4 py-3">Ενεργό όριο</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const pct = usagePercent(row);
                const hasOverride = row.geminiTokenLimitOverride != null;
                const effectiveLimit = hasOverride
                  ? row.geminiTokenLimitOverride
                  : row.planDefaultLimit;
                const draft = overrideDraft[row.id] ?? "";
                const unchanged = overrideDraftMatchesSaved(row, draft);

                return (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-brand-blue/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-navy">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.adminEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                          PLAN_BADGE[row.plan] ?? "bg-slate-100 text-slate-700 ring-slate-200",
                        )}
                      >
                        {PLAN_LABELS[row.plan] ?? row.plan}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {STATUS_LABELS[row.status] ?? row.status}
                      </p>
                    </td>
                    <td className={cn("px-4 py-3 tabular-nums", usageTone(row))}>
                      <p>{formatGeminiTokenCount(row.geminiTokensThisMonth)}</p>
                      {pct != null ? (
                        <p className="text-[11px] text-slate-400">{pct}% του ορίου</p>
                      ) : row.geminiTokenLimit === null ? (
                        <p className="text-[11px] text-slate-400">απεριόριστο</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatLimit(row.planDefaultLimit)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className={cn(dashboardFieldClass, "w-28 py-1.5 text-xs tabular-nums")}
                        placeholder="από πακέτο"
                        value={overrideDraft[row.id] ?? ""}
                        onChange={(e) =>
                          setOverrideDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-brand-navy">
                      {formatLimit(effectiveLimit)}
                      {hasOverride ? (
                        <span className="ml-1 text-[10px] font-normal text-brand-blue">custom</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={savingId === row.id || unchanged}
                          className={cn(
                            buttonClass("primary", "sm"),
                            "inline-flex items-center gap-1 px-2 py-1 text-xs",
                            unchanged && "opacity-50",
                          )}
                          onClick={() => void saveOverride(row)}
                        >
                          {savedId === row.id ? (
                            <Check className="h-3 w-3" />
                          ) : savingId === row.id ? (
                            "…"
                          ) : (
                            "Αποθήκευση"
                          )}
                        </button>
                        <Link
                          href="/supervisor/organizations"
                          className="text-xs font-semibold text-brand-blue hover:underline"
                        >
                          Πελάτες
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Κενό custom όριο = χρησιμοποιείται το default του πακέτου. Για απεριόριστο (Enterprise) άφησε κενό και βεβαιώσου ότι το πακέτο είναι Enterprise.
      </p>
    </DashboardPage>
  );
}
