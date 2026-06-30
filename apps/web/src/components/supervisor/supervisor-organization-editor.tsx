"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow, SupervisorUserRow } from "@/lib/supervisor-service";
import {
  stripeCustomerDashboardUrl,
  stripeSubscriptionDashboardUrl,
} from "@/lib/stripe-dashboard-urls";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Διαχειριστής",
  MANAGER: "Manager",
  STAFF: "Προσωπικό",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR");
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
  const [tab, setTab] = useState<"subscription" | "users">("subscription");
  const [plan, setPlan] = useState(organization.plan);
  const [status, setStatus] = useState(organization.status);
  const [extendTrialDays, setExtendTrialDays] = useState("7");
  const [grantProMonths, setGrantProMonths] = useState("12");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<SupervisorUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [addingUser, setAddingUser] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(false);
    try {
      const res = await fetch(`/api/supervisor/organizations/${organization.id}/users`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { users: SupervisorUserRow[] };
      setUsers(data.users);
    } catch {
      setUsersError(true);
    } finally {
      setUsersLoading(false);
    }
  }, [organization.id]);

  useEffect(() => {
    if (tab === "users") void loadUsers();
  }, [tab, loadUsers]);

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
      if (data.organization) {
        setPlan(data.organization.plan);
        setStatus(data.organization.status);
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

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setAddingUser(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/supervisor/organizations/${organization.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία.");
        return;
      }
      setMessage(data.message ?? "Προστέθηκε ο χρήστης.");
      setUsers((prev) => [...prev, data.user as SupervisorUserRow]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("STAFF");
      onSaved();
    } catch {
      setError("Σφάλμα δικτύου.");
    } finally {
      setAddingUser(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/40 p-4 sm:items-center">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-brand-blue/20 shadow-xl">
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

        <div className="mt-5 flex gap-2 border-b border-slate-100">
          {(
            [
              ["subscription", "Συνδρομή"],
              ["users", "Χρήστες"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition",
                tab === key
                  ? "border-brand-blue text-brand-navy"
                  : "border-transparent text-slate-500 hover:text-brand-navy",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "subscription" ? (
          <>
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

            {(organization.stripeCustomerId || organization.stripeSubId) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {organization.stripeCustomerId ? (
                  <a
                    href={stripeCustomerDashboardUrl(organization.stripeCustomerId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                  >
                    Stripe customer
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
                {organization.stripeSubId ? (
                  <a
                    href={stripeSubscriptionDashboardUrl(organization.stripeSubId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                  >
                    Stripe subscription
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-6 space-y-6">
            {usersLoading ? (
              <p className="text-sm text-slate-500">Φόρτωση χρηστών…</p>
            ) : usersError ? (
              <p className="text-sm text-red-600">Αποτυχία φόρτωσης χρηστών.</p>
            ) : users.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-brand-surface text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Όνομα</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Ρόλος</th>
                      <th className="px-3 py-2">Από</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-brand-navy">{user.name}</td>
                        <td className="px-3 py-2 text-slate-600">{user.email}</td>
                        <td className="px-3 py-2 text-slate-600">{ROLE_LABELS[user.role] ?? user.role}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Δεν υπάρχουν χρήστες.</p>
            )}

            <form onSubmit={(e) => void addUser(e)} className="rounded-xl border border-brand-blue/15 bg-brand-surface/40 p-4">
              <p className="text-sm font-semibold text-brand-navy">Προσθήκη χρήστη</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Όνομα</span>
                  <input
                    className={dashboardFieldClass}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Email</span>
                  <input
                    className={dashboardFieldClass}
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Password (min 8)</span>
                  <input
                    className={dashboardFieldClass}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Ρόλος</span>
                  <select className={dashboardFieldClass} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="ADMIN">Διαχειριστής</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Προσωπικό</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={addingUser}
                className={`mt-4 ${buttonClass("primary", "sm")}`}
              >
                {addingUser ? "Προσθήκη…" : "Προσθήκη χρήστη"}
              </button>
            </form>
          </div>
        )}

        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>
    </div>
  );
}
