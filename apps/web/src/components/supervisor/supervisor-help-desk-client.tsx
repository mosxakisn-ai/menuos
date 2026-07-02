"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LifeBuoy,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type {
  HelpDeskCustomerRow,
  HelpDeskReportRow,
} from "@/lib/client-diagnostics-service";
import { cn } from "@/lib/utils";

type Summary = {
  openCount: number;
  last24h: number;
  affectedCustomers: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  pdf_import: "PDF import",
  catalog: "Κατάλογος",
  billing: "Συνδρομή",
  qr: "QR",
  waiter: "Σερβιτόρος",
  settings: "Ρυθμίσεις",
  dashboard: "Panel",
  auth: "Σύνδεση",
  subscription: "Συνδρομή",
  api: "API",
  client: "Browser",
  unknown: "Άλλο",
};

const SOURCE_LABELS: Record<string, string> = {
  client_api: "API (browser)",
  client_nav: "Πλοήγηση",
  server: "Server",
  client: "Browser",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("el-GR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityClass(severity: string) {
  if (severity === "ERROR") return "bg-red-100 text-red-800 ring-red-200";
  if (severity === "WARN") return "bg-amber-100 text-amber-900 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function statusClass(status: string) {
  if (status === "OPEN") return "bg-red-50 text-red-700 ring-red-200";
  if (status === "ACKNOWLEDGED") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className={cn("border-white/80 p-4 shadow-card", accent)}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{value}</p>
    </Card>
  );
}

export function SupervisorHelpDeskClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<HelpDeskCustomerRow[]>([]);
  const [reports, setReports] = useState<HelpDeskReportRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<HelpDeskCustomerRow | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ status });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/supervisor/help-desk?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { summary: Summary; customers: HelpDeskCustomerRow[] };
      setSummary(data.summary);
      setCustomers(data.customers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  const loadReports = useCallback(async (orgId: string | null) => {
    if (!orgId && orgId !== null) return;
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        organizationId: orgId ?? "unknown",
        status: "ALL",
      });
      const res = await fetch(`/api/supervisor/help-desk?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { reports: HelpDeskReportRow[] };
      setReports(data.reports);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function selectCustomer(row: HelpDeskCustomerRow) {
    setSelectedOrgId(row.organizationId);
    setSelectedCustomer(row);
    setExpandedId(null);
    void loadReports(row.organizationId);
  }

  async function patchReport(id: string, patch: { status?: string; internalNote?: string | null }) {
    const res = await fetch(`/api/supervisor/help-desk/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    if (selectedOrgId !== undefined) {
      await loadReports(selectedOrgId);
      await loadCustomers();
    }
  }

  return (
    <DashboardPage wide>
      <DashboardPageHeader title="Help Desk" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Ανοιχτά" value={summary?.openCount ?? 0} accent="border-red-100/80" />
        <Kpi label="Τελευταίες 24 ώρες" value={summary?.last24h ?? 0} accent="border-amber-100/80" />
        <Kpi
          label="Πελάτες με θέμα"
          value={summary?.affectedCustomers ?? 0}
          accent="border-brand-blue/15"
        />
      </div>

      <Card className="grid gap-4 border-brand-blue/10 p-4 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-2">
          <span className={dashboardLabelClass}>Αναζήτηση</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={cn(dashboardFieldClass, "pl-9")}
              placeholder="Επιχείρηση, email, μήνυμα σφάλματος…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Κατάσταση</span>
          <select className={dashboardFieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Ενεργά (ανοιχτά + σε εξέλιξη)</option>
            <option value="OPEN">Μόνο ανοιχτά</option>
            <option value="ACKNOWLEDGED">Σε εξέλιξη</option>
            <option value="RESOLVED">Επιλυμένα</option>
            <option value="ALL">Όλα</option>
          </select>
        </label>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void loadCustomers()}
          className={cn(buttonClass("secondary", "sm"), "inline-flex items-center gap-2")}
        >
          <RefreshCw className="h-4 w-4" />
          Ανανέωση
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Φόρτωση…</p>
      ) : customers.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="font-semibold text-brand-navy">Καμία ενεργή αναφορά</p>
          <p className="max-w-md text-sm text-slate-600">
            Όταν κάποιος πελάτης έχει σφάλμα στο panel, θα εμφανίζεται εδώ αυτόματα.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 bg-brand-surface px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Πελάτες</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {customers.map((row) => {
                const active =
                  selectedOrgId === row.organizationId ||
                  (selectedOrgId === null && row.organizationId === null);
                return (
                  <li key={row.organizationId ?? "unknown"}>
                    <button
                      type="button"
                      onClick={() => selectCustomer(row)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-blue/[0.03]",
                        active && "bg-brand-blue/[0.06] ring-1 ring-inset ring-brand-blue/15",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand-navy">{row.organizationName}</p>
                          {row.openCount > 0 ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {row.openCount} ανοιχτά
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{row.adminEmail ?? "—"}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{row.latestMessage}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {CATEGORY_LABELS[row.latestCategory] ?? row.latestCategory} ·{" "}
                          {formatWhen(row.latestAt)}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-card border border-slate-200 bg-white shadow-card">
            {!selectedCustomer ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-500">
                <LifeBuoy className="h-10 w-10 text-brand-blue/40" />
                <p className="text-sm">Επίλεξε πελάτη για λεπτομέρειες σφαλμάτων.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Αναφορές</p>
                  <h3 className="mt-1 font-serif text-lg font-bold text-brand-navy">
                    {selectedCustomer.organizationName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedCustomer.adminEmail ?? "—"}
                    {selectedCustomer.plan ? ` · ${selectedCustomer.plan}` : ""}
                    {selectedCustomer.subscriptionStatus
                      ? ` · ${selectedCustomer.subscriptionStatus}`
                      : ""}
                  </p>
                </div>
                {loadingReports ? (
                  <p className="p-5 text-sm text-slate-500">Φόρτωση αναφορών…</p>
                ) : reports.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Δεν βρέθηκαν αναφορές.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {reports.map((report) => {
                      const open = expandedId === report.id;
                      return (
                        <li key={report.id} className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(open ? null : report.id)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <AlertTriangle
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                report.severity === "ERROR" ? "text-red-600" : "text-amber-600",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
                                    severityClass(report.severity),
                                  )}
                                >
                                  {report.severity}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
                                    statusClass(report.status),
                                  )}
                                >
                                  {report.status}
                                </span>
                                <span className="text-[10px] font-semibold uppercase text-slate-400">
                                  {CATEGORY_LABELS[report.category] ?? report.category}
                                </span>
                                {report.occurrenceCount > 1 ? (
                                  <span className="text-[10px] text-slate-500">×{report.occurrenceCount}</span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm font-medium text-brand-navy">{report.message}</p>
                              {report.errorCode ? (
                                <p className="mt-0.5 font-mono text-xs text-slate-500">{report.errorCode}</p>
                              ) : null}
                              <p className="mt-1 text-xs text-slate-400">
                                {formatWhen(report.lastSeenAt)} ·{" "}
                                {SOURCE_LABELS[report.source] ?? report.source}
                                {report.userEmail ? ` · ${report.userEmail}` : ""}
                              </p>
                            </div>
                          </button>

                          {open ? (
                            <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                              {report.stack ? (
                                <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                                  {report.stack}
                                </pre>
                              ) : null}
                              {report.context ? (
                                <pre className="max-h-32 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] text-slate-700">
                                  {JSON.stringify(report.context, null, 2)}
                                </pre>
                              ) : null}
                              <label className="block text-xs">
                                <span className={dashboardLabelClass}>Σημείωση ops</span>
                                <textarea
                                  className={cn(dashboardFieldClass, "mt-1 min-h-[4rem] font-normal")}
                                  value={noteDraft[report.id] ?? report.internalNote ?? ""}
                                  onChange={(e) =>
                                    setNoteDraft((prev) => ({ ...prev, [report.id]: e.target.value }))
                                  }
                                  placeholder="Εσωτερική σημείωση ops…"
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {report.status !== "ACKNOWLEDGED" && report.status !== "RESOLVED" ? (
                                  <button
                                    type="button"
                                    className={buttonClass("secondary", "sm")}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "ACKNOWLEDGED",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    Σε εξέλιξη
                                  </button>
                                ) : null}
                                {report.status !== "RESOLVED" ? (
                                  <button
                                    type="button"
                                    className={buttonClass("primary", "sm")}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "RESOLVED",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    Επιλύθηκε
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={buttonClass("secondary", "sm")}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "OPEN",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    Ξανά άνοιγμα
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
