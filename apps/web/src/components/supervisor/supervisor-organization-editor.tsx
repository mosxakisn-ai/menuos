"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow, SupervisorUserRow } from "@/lib/supervisor-service";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Διαχειριστής",
  MANAGER: "Manager",
  STAFF: "Προσωπικό",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR");
}

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
  const [tab, setTab] = useState<"subscription" | "users">("subscription");
  const [plan, setPlan] = useState(organization.plan);
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
              onClick={() => {
                setTab(key);
                setMessage(null);
                setError(null);
              }}
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
            {message && tab === "subscription" ? (
              <p className="text-sm text-emerald-700">{message}</p>
            ) : null}
            {error && tab === "subscription" ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
          </div>
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
            {message && tab === "users" ? (
              <p className="text-sm text-emerald-700">{message}</p>
            ) : null}
            {error && tab === "users" ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
