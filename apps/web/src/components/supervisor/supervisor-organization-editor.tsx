"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";

function planStatusForSave(plan: string): string {
  return plan === "TRIAL" ? "TRIALING" : "ACTIVE";
}

export function SupervisorOrganizationEditor({
  organization,
  onClose,
  onSaved,
}: {
  organization: SupervisorOrganizationRow;
  onClose: () => void;
  onSaved: (updated?: SupervisorOrganizationRow) => void;
}) {
  const [plan, setPlan] = useState(organization.plan);
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
      setMessage(data.message ?? "Αποθήκευση πακέτου.");
      if (data.organization) {
        setPlan(data.organization.plan);
        onSaved(data.organization);
      } else {
        onSaved();
      }
    } catch {
      setError("Σφάλμα δικτύου.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/40 p-4 sm:items-center">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-brand-blue/20 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Επεξεργασία πελάτη</p>
            <h2 className="font-serif text-xl font-bold text-brand-navy">{organization.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className={dashboardLabelClass}>Πακέτο</span>
            <select className={dashboardFieldClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="TRIAL">TRIAL</option>
              <option value="BASIC">BASIC</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </label>
          <button
            type="button"
            disabled={saving || plan === organization.plan}
            className={buttonClass("primary", "sm")}
            onClick={() => void save({ plan, status: planStatusForSave(plan) })}
          >
            {saving ? "Αποθήκευση…" : "Αποθήκευση"}
          </button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </Card>
    </div>
  );
}
