"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import type { SupervisorOperatorRow } from "@/lib/supervisor-operator-service";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR");
}

export function SupervisorUsersClient() {
  const [operators, setOperators] = useState<SupervisorOperatorRow[]>([]);
  const [currentUsername, setCurrentUsername] = useState("");
  const [canChangeOwnPassword, setCanChangeOwnPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [ownCurrentPassword, setOwnCurrentPassword] = useState("");
  const [ownNewPassword, setOwnNewPassword] = useState("");
  const [ownConfirmPassword, setOwnConfirmPassword] = useState("");
  const [changingOwnPassword, setChangingOwnPassword] = useState(false);
  const [ownPasswordError, setOwnPasswordError] = useState<string | null>(null);
  const [ownPasswordMessage, setOwnPasswordMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/supervisor/operators", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as {
        operators: SupervisorOperatorRow[];
        currentUsername: string;
        canChangeOwnPassword: boolean;
      };
      setOperators(data.operators);
      setCurrentUsername(data.currentUsername);
      setCanChangeOwnPassword(data.canChangeOwnPassword);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addOperator(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setFormError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/supervisor/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Αποτυχία.");
        return;
      }
      setMessage(data.message ?? "Προστέθηκε μέλος.");
      setOperators((prev) => [...prev, data.operator as SupervisorOperatorRow]);
      setUsername("");
      setName("");
      setPassword("");
    } catch {
      setFormError("Σφάλμα δικτύου.");
    } finally {
      setAdding(false);
    }
  }

  async function patchOperator(id: string, patch: Record<string, unknown>) {
    setFormError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/supervisor/operators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Αποτυχία.");
        return false;
      }
      setOperators((prev) =>
        prev.map((op) => (op.id === id ? (data.operator as SupervisorOperatorRow) : op)),
      );
      setMessage(data.message ?? "Ενημερώθηκε.");
      return true;
    } catch {
      setFormError("Σφάλμα δικτύου.");
      return false;
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    setResetting(true);
    const ok = await patchOperator(resetId, { password: resetPassword });
    if (ok) {
      setResetId(null);
      setResetPassword("");
    }
    setResetting(false);
  }

  async function submitOwnPassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingOwnPassword(true);
    setOwnPasswordError(null);
    setOwnPasswordMessage(null);
    try {
      const res = await fetch("/api/supervisor/operators/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: ownCurrentPassword,
          newPassword: ownNewPassword,
          confirmPassword: ownConfirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOwnPasswordError(data.error ?? "Αποτυχία.");
        return;
      }
      setOwnPasswordMessage(data.message ?? "Ο κωδικός άλλαξε.");
      setOwnCurrentPassword("");
      setOwnNewPassword("");
      setOwnConfirmPassword("");
    } catch {
      setOwnPasswordError("Σφάλμα δικτύου.");
    } finally {
      setChangingOwnPassword(false);
    }
  }

  const ownPasswordValid =
    ownCurrentPassword.length > 0 &&
    ownNewPassword.length >= 8 &&
    ownConfirmPassword.length >= 8 &&
    ownNewPassword === ownConfirmPassword;

  const envOnly = operators.length === 0 && currentUsername && !canChangeOwnPassword;

  return (
    <DashboardPage wide>
      <DashboardPageHeader
        title="Ομάδα Ops"
        description="Εσωτερικοί λογαριασμοί για πρόσβαση στο supervisor panel — όχι χρήστες πελατών."
      />

      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}
      {formError ? <p className="mb-4 text-sm text-red-600">{formError}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Φόρτωση…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : (
        <>
          {envOnly ? (
            <Card className="mb-6 border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
              Συνδεδεμένος ως <strong>{currentUsername}</strong> (λογαριασμός από .env). Πρόσθεσε
              μέλη ομάδας παρακάτω για διαχείριση από τη βάση — ή άλλαξε τον κωδικό στο server .env.
            </Card>
          ) : null}

          {canChangeOwnPassword ? (
            <Card className="mb-6 border-brand-blue/15 bg-brand-surface/40 p-4">
              <p className="text-sm font-semibold text-brand-navy">Αλλαγή δικού σου κωδικού</p>
              {ownPasswordMessage ? (
                <p className="mt-2 text-sm text-emerald-700">{ownPasswordMessage}</p>
              ) : null}
              {ownPasswordError ? (
                <p className="mt-2 text-sm text-red-600">{ownPasswordError}</p>
              ) : null}
              <form
                onSubmit={(e) => void submitOwnPassword(e)}
                className="mt-3 grid gap-3 sm:grid-cols-3"
              >
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Τρέχων κωδικός</span>
                  <input
                    className={dashboardFieldClass}
                    type="password"
                    value={ownCurrentPassword}
                    onChange={(e) => setOwnCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder={FORM_PLACEHOLDERS.passwordCurrent}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Νέος κωδικός (min 8)</span>
                  <input
                    className={dashboardFieldClass}
                    type="password"
                    value={ownNewPassword}
                    onChange={(e) => setOwnNewPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={FORM_PLACEHOLDERS.passwordNew}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className={dashboardLabelClass}>Επιβεβαίωση</span>
                  <input
                    className={dashboardFieldClass}
                    type="password"
                    value={ownConfirmPassword}
                    onChange={(e) => setOwnConfirmPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder={FORM_PLACEHOLDERS.passwordNew}
                    required
                  />
                </label>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={changingOwnPassword || !ownPasswordValid}
                    className={buttonClass("primary", "sm")}
                  >
                    {changingOwnPassword ? "Αποθήκευση…" : "Αποθήκευση κωδικού"}
                  </button>
                </div>
              </form>
            </Card>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-brand-surface text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Όνομα</th>
                  <th className="px-3 py-2">Κατάσταση</th>
                  <th className="px-3 py-2">Από</th>
                  <th className="px-3 py-2">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-brand-navy">{op.username}</td>
                    <td className="px-3 py-2 text-slate-600">{op.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          op.active ? "text-emerald-700" : "text-slate-400 line-through"
                        }
                      >
                        {op.active ? "Ενεργός" : "Ανενεργός"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(op.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={buttonClass("ghost", "sm")}
                          onClick={() => {
                            setResetId(op.id);
                            setResetPassword("");
                            setFormError(null);
                          }}
                        >
                          Νέο password
                        </button>
                        {op.active ? (
                          <button
                            type="button"
                            className={buttonClass("ghost", "sm")}
                            onClick={() => void patchOperator(op.id, { active: false })}
                          >
                            Απενεργοποίηση
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={buttonClass("ghost", "sm")}
                            onClick={() => void patchOperator(op.id, { active: true })}
                          >
                            Ενεργοποίηση
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!operators.length ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      {canChangeOwnPassword
                        ? "Δεν υπάρχουν άλλα μέλη ομάδας."
                        : "Δεν υπάρχουν μέλη στη βάση — μόνο ο λογαριασμός .env."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Card className="mt-6 border-brand-blue/15 bg-brand-surface/40 p-4">
            <p className="text-sm font-semibold text-brand-navy">Προσθήκη μέλους ομάδας</p>
            <form onSubmit={(e) => void addOperator(e)} className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Username</span>
                <input
                  className={dashboardFieldClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  pattern="[a-zA-Z0-9._-]+"
                  minLength={2}
                  required
                  autoComplete="off"
                  placeholder={FORM_PLACEHOLDERS.supervisorUsername}
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Όνομα</span>
                <input
                  className={dashboardFieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={FORM_PLACEHOLDERS.supervisorName}
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Password (min 8)</span>
                <input
                  className={dashboardFieldClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  placeholder={FORM_PLACEHOLDERS.passwordNew}
                />
              </label>
              <div className="sm:col-span-3">
                <button type="submit" disabled={adding} className={buttonClass("primary", "sm")}>
                  {adding ? "Προσθήκη…" : "Προσθήκη μέλους"}
                </button>
              </div>
            </form>
          </Card>
        </>
      )}

      {resetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 p-4">
          <Card className="w-full max-w-md border-brand-blue/20 p-5 shadow-xl">
            <p className="font-semibold text-brand-navy">Reset password (άλλου μέλους)</p>
            <form onSubmit={(e) => void submitReset(e)} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Password (min 8)</span>
                <input
                  className={dashboardFieldClass}
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  minLength={8}
                  required
                  autoFocus
                  placeholder={FORM_PLACEHOLDERS.passwordNew}
                />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={resetting} className={buttonClass("primary", "sm")}>
                  {resetting ? "Αποθήκευση…" : "Αποθήκευση"}
                </button>
                <button
                  type="button"
                  className={buttonClass("ghost", "sm")}
                  onClick={() => {
                    setResetId(null);
                    setResetPassword("");
                  }}
                >
                  Ακύρωση
                </button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </DashboardPage>
  );
}
