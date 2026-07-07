"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { ORGANIZATION_ACTIVITY_LABELS, type OrganizationActivity } from "@menuos/shared";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import {
  DashboardPage,
  DashboardPageHeader,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { SupervisorOrganizationEditor } from "@/components/supervisor/supervisor-organization-editor";
import { stripeCustomerDashboardUrl } from "@/lib/stripe-dashboard-urls";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";
import { formatGeminiTokenCount } from "@/lib/gemini-usage-service";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { cn } from "@/lib/utils";

const TH =
  "px-3 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 align-middle text-sm text-slate-700";
const TD_CENTER = cn(TD, "text-center tabular-nums");

function formatGeminiUsageCell(row: SupervisorOrganizationRow): string {
  const used = formatGeminiTokenCount(row.geminiTokensThisMonth);
  if (row.geminiTokenLimit === null) return `${used} / ∞`;
  return `${used} / ${formatGeminiTokenCount(row.geminiTokenLimit)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("el-GR");
}

function formatActivity(activity: OrganizationActivity | null) {
  if (!activity) return "—";
  return ORGANIZATION_ACTIVITY_LABELS[activity] ?? activity;
}

function formatPhone(row: SupervisorOrganizationRow) {
  const phone = row.phone?.trim();
  const mobile = row.mobile?.trim();
  if (phone && mobile && phone !== mobile) return { primary: phone, secondary: mobile };
  if (phone) return { primary: phone, secondary: null };
  if (mobile) return { primary: mobile, secondary: null };
  return { primary: "—", secondary: null };
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className="inline-flex rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : status === "TRIALING"
        ? "bg-amber-100 text-amber-900"
        : status === "PAST_DUE"
          ? "bg-red-100 text-red-800"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", tone)}>
      {status}
    </span>
  );
}

export function SupervisorOrganizationsClient({ mode }: { mode: "all" | "subscriptions" }) {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<SupervisorOrganizationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<SupervisorOrganizationRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      if (plan) params.set("plan", plan);
      if (status) params.set("status", status);
      const res = await fetch(`/api/supervisor/organizations?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { organizations: SupervisorOrganizationRow[] };
      setRows(data.organizations);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, plan, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardPage className="max-w-none">
      <DashboardPageHeader
        title={mode === "subscriptions" ? "Συνδρομές" : "Πελάτες"}
        description={
          loading
            ? "Φόρτωση…"
            : `${rows.length} εγγραφές · επεξεργασία συνδρομής χωρίς διαγραφή δεδομένων`
        }
      />

      <Card className="border-brand-blue/10 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block min-w-0 text-sm">
            <span className={dashboardLabelClass}>Αναζήτηση</span>
            <input
              className={dashboardFieldClass}
              placeholder={FORM_PLACEHOLDERS.searchOrganizations}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block min-w-0 text-sm">
            <span className={dashboardLabelClass}>Πακέτο</span>
            <select className={dashboardFieldClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="">Όλα</option>
              <option value="TRIAL">TRIAL</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </label>
          <label className="block min-w-0 text-sm">
            <span className={dashboardLabelClass}>Κατάσταση</span>
            <select className={dashboardFieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Όλες</option>
              <option value="TRIALING">TRIALING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAST_DUE">PAST_DUE</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </label>
        </div>
      </Card>

      {error ? (
        <p className="text-center text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="text-center text-sm text-slate-500">Φόρτωση…</p>
      ) : rows.length ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-card">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-brand-surface/80">
                  <th className={cn(TH, "w-12 text-center")}>#</th>
                  <th className={cn(TH, "min-w-[140px]")}>Επιχείρηση</th>
                  <th className={cn(TH, "min-w-[100px]")}>Πόλη</th>
                  <th className={cn(TH, "min-w-[110px]")}>Επάγγελμα</th>
                  <th className={cn(TH, "min-w-[120px]")}>Τηλέφωνο</th>
                  <th className={cn(TH, "min-w-[160px]")}>Admin</th>
                  <th className={cn(TH, "text-center")}>Πακέτο</th>
                  <th className={cn(TH, "text-center")}>Status</th>
                  <th className={cn(TH, "text-center")}>Trial / Λήξη</th>
                  {mode === "subscriptions" ? (
                    <th className={cn(TH, "text-center")}>Stripe</th>
                  ) : (
                    <>
                      <th className={cn(TH, "text-center")}>Καταστ.</th>
                      <th className={cn(TH, "text-center")}>Είδη</th>
                      <th className={cn(TH, "text-center")}>Gemini</th>
                    </>
                  )}
                  <th className={cn(TH, "text-right pr-4")}>Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const phone = formatPhone(row);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-slate-50 last:border-0 transition-colors hover:bg-brand-blue/[0.04]",
                        editing?.id === row.id && "bg-brand-blue/10",
                      )}
                    >
                      <td className={cn(TD_CENTER, "font-medium text-slate-400")}>#{index + 1}</td>
                      <td className={TD}>
                        <p className="font-semibold text-brand-navy">{row.name}</p>
                        {row.isDemo ? (
                          <span className="mt-0.5 inline-flex rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                            Demo
                          </span>
                        ) : null}
                      </td>
                      <td className={TD}>
                        <span className="text-slate-700">{row.city?.trim() || "—"}</span>
                      </td>
                      <td className={TD}>
                        <span className="text-slate-700">{formatActivity(row.activity)}</span>
                      </td>
                      <td className={TD}>
                        <p className="whitespace-nowrap text-slate-700">{phone.primary}</p>
                        {phone.secondary ? (
                          <p className="text-xs text-slate-500">{phone.secondary}</p>
                        ) : null}
                      </td>
                      <td className={TD}>
                        <p className="font-medium text-slate-800">{row.adminName}</p>
                        <p className="truncate text-xs text-slate-500">{row.adminEmail}</p>
                      </td>
                      <td className={cn(TD, "text-center")}>
                        <PlanBadge plan={row.plan} />
                      </td>
                      <td className={cn(TD, "text-center")}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className={TD_CENTER}>
                        {formatDate(row.trialEndsAt || row.currentPeriodEnd)}
                      </td>
                      {mode === "subscriptions" ? (
                        <td className={cn(TD, "text-center")}>
                          {row.stripeCustomerId ? (
                            <a
                              href={stripeCustomerDashboardUrl(row.stripeCustomerId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 text-brand-blue hover:underline"
                            >
                              Stripe
                              <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      ) : (
                        <>
                          <td className={TD_CENTER}>{row.venueCount}</td>
                          <td className={TD_CENTER}>{row.itemCount}</td>
                          <td className={cn(TD_CENTER, "text-xs")}>{formatGeminiUsageCell(row)}</td>
                        </>
                      )}
                      <td className={cn(TD, "pr-4 text-right")}>
                        <button
                          type="button"
                          className={buttonClass("secondary", "sm")}
                          onClick={() => setEditing(row)}
                        >
                          Επεξεργασία
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {editing ? (
            <SupervisorOrganizationEditor
              organization={editing}
              defaultTab={mode === "subscriptions" ? "subscription" : "details"}
              onClose={() => setEditing(null)}
              onSaved={(updated) => {
                if (updated) setEditing(updated);
                void load();
              }}
            />
          ) : null}
        </>
      ) : (
        <Card className="border-brand-blue/10">
          <p className="text-center text-sm text-slate-600">Δεν βρέθηκαν εγγραφές.</p>
        </Card>
      )}
    </DashboardPage>
  );
}
