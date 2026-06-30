"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { SupervisorOrganizationEditor } from "@/components/supervisor/supervisor-organization-editor";
import { stripeCustomerDashboardUrl } from "@/lib/stripe-dashboard-urls";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("el-GR");
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
    <DashboardPage wide>
      <DashboardPageHeader
        title={mode === "subscriptions" ? "Συνδρομές" : "Πελάτες"}
        description={
          loading
            ? "Φόρτωση…"
            : `${rows.length} εγγραφές · επεξεργασία συνδρομής χωρίς διαγραφή δεδομένων`
        }
      />

      <Card className="grid gap-4 border-brand-blue/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Αναζήτηση</span>
          <input
            className={dashboardFieldClass}
            placeholder={FORM_PLACEHOLDERS.searchOrganizations}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Πακέτο</span>
          <select className={dashboardFieldClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="">Όλα</option>
            <option value="TRIAL">TRIAL</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Κατάσταση</span>
          <select className={dashboardFieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Όλες</option>
            <option value="TRIALING">TRIALING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAST_DUE">PAST_DUE</option>
            <option value="CANCELED">CANCELED</option>
          </select>
        </label>
      </Card>

      {error ? (
        <p className="text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Φόρτωση…</p>
      ) : rows.length ? (
        <>
          <div className="overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-brand-surface text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-12 px-3 py-3">#</th>
                  <th className="px-4 py-3">Επιχείρηση</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Πακέτο</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Trial / Λήξη</th>
                  {mode === "subscriptions" ? (
                    <th className="px-4 py-3">Stripe</th>
                  ) : (
                    <>
                      <th className="px-4 py-3">Venues</th>
                      <th className="px-4 py-3">Πιάτα</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-50 last:border-0 hover:bg-brand-blue/5 ${
                      editing?.id === row.id ? "bg-brand-blue/10" : ""
                    }`}
                  >
                    <td className="px-3 py-3 font-medium tabular-nums text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-navy">{row.name}</p>
                      {row.isDemo ? (
                        <span className="text-xs font-medium text-brand-blue">Demo</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{row.adminName}</p>
                      <p className="text-xs">{row.adminEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.plan}</td>
                    <td className="px-4 py-3 text-slate-600">{row.status}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(row.trialEndsAt || row.currentPeriodEnd)}
                    </td>
                    {mode === "subscriptions" ? (
                      <td className="px-4 py-3 text-slate-600">
                        {row.stripeCustomerId ? (
                          <a
                            href={stripeCustomerDashboardUrl(row.stripeCustomerId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-blue hover:underline"
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
                        <td className="px-4 py-3 text-slate-600">{row.venueCount}</td>
                        <td className="px-4 py-3 text-slate-600">{row.itemCount}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className={buttonClass("secondary", "sm")}
                        onClick={() => setEditing(row)}
                      >
                        Επεξεργασία
                      </button>
                    </td>
                  </tr>
                ))}
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
          <p className="text-sm text-slate-600">Δεν βρέθηκαν εγγραφές.</p>
        </Card>
      )}
    </DashboardPage>
  );
}
