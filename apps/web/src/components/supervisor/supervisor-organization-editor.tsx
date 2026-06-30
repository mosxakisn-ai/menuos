"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";

export function SupervisorOrganizationEditor({
  organization,
  onClose,
  onSaved,
}: {
  organization: SupervisorOrganizationRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [plan, setPlan] = useState(organization.plan);
  const [status, setStatus] = useState(organization.status);
  const [extendTrialDays, setExtendTrialDays] = useState("7");
  const [grantProMonths, setGrantProMonths] = useState("12");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/supervisor/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία.");
        return;
      }
      setMessage(data.message ?? "OK");
      onSaved();
    } catch {
      setError("Σφάλμα δικτύου.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/40 p-4 sm:items-center">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-brand-blue/20 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Επεξεργασία πελάτη</p>
            <h2 className="font-serif text-xl font-bold text-brand-navy">{organization.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{organization.adminEmail}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className={dashboardLabelClass}>Πακέτο</span>
            <select className={dashboardFieldClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="TRIAL">TRIAL</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className={dashboardLabelClass}>Κατάσταση</span>
            <select className={dashboardFieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="TRIALING">TRIALING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAST_DUE">PAST_DUE</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            className={buttonClass("primary", "sm")}
            onClick={() => void save({ plan, status })}
          >
            Αποθήκευση plan/status
          </button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-brand-navy">Γρήγορες ενέργειες</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Επέκταση trial (μέρες)</span>
              <input
                className={dashboardFieldClass}
                type="number"
                min={1}
                max={90}
                value={extendTrialDays}
                onChange={(e) => setExtendTrialDays(e.target.value)}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={saving}
                className={`w-full ${buttonClass("secondary", "sm")}`}
                onClick={() =>
                  void save({ extendTrialDays: Number.parseInt(extendTrialDays, 10) || 7 })
                }
              >
                + Trial days
              </button>
            </div>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Grant Pro (μήνες)</span>
              <input
                className={dashboardFieldClass}
                type="number"
                min={1}
                max={60}
                value={grantProMonths}
                onChange={(e) => setGrantProMonths(e.target.value)}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={saving}
                className={`w-full ${buttonClass("primary", "sm")}`}
                onClick={() =>
                  void save({ grantProMonths: Number.parseInt(grantProMonths, 10) || 12 })
                }
              >
                Grant Pro
              </button>
            </div>
          </div>
        </div>

        {organization.stripeCustomerId ? (
          <p className="mt-4 text-xs text-slate-500">Stripe customer: {organization.stripeCustomerId}</p>
        ) : null}

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>
    </div>
  );
}
