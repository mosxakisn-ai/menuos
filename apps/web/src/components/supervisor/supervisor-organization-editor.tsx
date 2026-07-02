"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow } from "@/lib/supervisor-service";
import {
  stripeCustomerDashboardUrl,
  stripeSubscriptionDashboardUrl,
} from "@/lib/stripe-dashboard-urls";
import { ORGANIZATION_ACTIVITIES, ORGANIZATION_ACTIVITY_LABELS } from "@menuos/shared";
import { cn } from "@/lib/utils";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Διαχειριστής",
  MANAGER: "Manager",
  STAFF: "Προσωπικό",
};

function planStatusForSave(plan: string): string {
  return plan === "TRIAL" ? "TRIALING" : "ACTIVE";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className={dashboardLabelClass}>{label}</dt>
      <dd className="mt-0.5 text-sm text-brand-navy">{children}</dd>
    </div>
  );
}

export function SupervisorOrganizationEditor({
  organization: initial,
  defaultTab = "details",
  onClose,
  onSaved,
}: {
  organization: SupervisorOrganizationRow;
  defaultTab?: "details" | "subscription";
  onClose: () => void;
  onSaved: (updated?: SupervisorOrganizationRow) => void;
}) {
  const [tab, setTab] = useState<"details" | "subscription">(defaultTab);
  const [organization, setOrganization] = useState(initial);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState(initial.name);
  const [adminEmail, setAdminEmail] = useState(initial.adminEmail);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [mobile, setMobile] = useState(initial.mobile ?? "");
  const [vatNumber, setVatNumber] = useState(initial.vatNumber ?? "");
  const [activity, setActivity] = useState(initial.activity ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");

  const [plan, setPlan] = useState(initial.plan);
  const [periodEnd, setPeriodEnd] = useState(
    initial.currentPeriodEnd ? initial.currentPeriodEnd.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/supervisor/organizations/${initial.id}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { organization: SupervisorOrganizationRow };
      setOrganization(data.organization);
      setBusinessName(data.organization.name);
      setAdminEmail(data.organization.adminEmail);
      setPhone(data.organization.phone ?? "");
      setMobile(data.organization.mobile ?? "");
      setVatNumber(data.organization.vatNumber ?? "");
      setActivity(data.organization.activity ?? "");
      setCity(data.organization.city ?? "");
      setNotes(data.organization.notes ?? "");
      setPlan(data.organization.plan);
      setPeriodEnd(
        data.organization.currentPeriodEnd ? data.organization.currentPeriodEnd.slice(0, 10) : "",
      );
    } catch {
      setError("Αποτυχία φόρτωσης στοιχείων.");
    } finally {
      setLoading(false);
    }
  }, [initial.id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function save(patch: Record<string, unknown>, successFallback: string) {
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
      setMessage(data.message ?? successFallback);
      if (data.organization) {
        setOrganization(data.organization);
        setBusinessName(data.organization.name);
        setAdminEmail(data.organization.adminEmail);
        setPhone(data.organization.phone ?? "");
        setMobile(data.organization.mobile ?? "");
        setVatNumber(data.organization.vatNumber ?? "");
        setActivity(data.organization.activity ?? "");
        setCity(data.organization.city ?? "");
        setNotes(data.organization.notes ?? "");
        setPlan(data.organization.plan);
        setPeriodEnd(
          data.organization.currentPeriodEnd ? data.organization.currentPeriodEnd.slice(0, 10) : "",
        );
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

  const profileDirty =
    businessName.trim() !== organization.name ||
    adminEmail.trim().toLowerCase() !== organization.adminEmail.toLowerCase() ||
    phone !== (organization.phone ?? "") ||
    mobile !== (organization.mobile ?? "") ||
    vatNumber !== (organization.vatNumber ?? "") ||
    activity !== (organization.activity ?? "") ||
    city !== (organization.city ?? "") ||
    notes !== (organization.notes ?? "");

  const profileValid =
    businessName.trim().length > 0 &&
    adminEmail.trim().length > 0 &&
    (vatNumber === "" || /^\d{9}$/.test(vatNumber));

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
              ["details", "Στοιχεία"],
              ["subscription", "Συνδρομή"],
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

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Φόρτωση…</p>
        ) : tab === "details" ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className={dashboardLabelClass}>Επωνυμία επιχείρησης</span>
                <input
                  className={dashboardFieldClass}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.businessName}
                  required
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className={dashboardLabelClass}>Email</span>
                <input
                  className={dashboardFieldClass}
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.email}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Τηλέφωνο</span>
                <input
                  className={dashboardFieldClass}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.phone}
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Κινητό</span>
                <input
                  className={dashboardFieldClass}
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.mobile}
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>ΑΦΜ</span>
                <input
                  className={dashboardFieldClass}
                  inputMode="numeric"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder={FORM_PLACEHOLDERS.vat}
                />
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Δραστηριότητα</span>
                <select
                  className={dashboardFieldClass}
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                >
                  <option value="">— Επιλογή —</option>
                  {ORGANIZATION_ACTIVITIES.map((key) => (
                    <option key={key} value={key}>
                      {ORGANIZATION_ACTIVITY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Πόλη</span>
                <input
                  className={dashboardFieldClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.city}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className={dashboardLabelClass}>Σημειώσεις (εσωτερικές)</span>
                <textarea
                  className={`${dashboardFieldClass} min-h-[88px] resize-y`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.internalNotes}
                />
              </label>
            </div>

            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-brand-surface/40 p-4 sm:grid-cols-2">
              <DetailRow label="Υπεύθυνος">{organization.adminName}</DetailRow>
              <DetailRow label="Slug">{organization.slug}</DetailRow>
              <DetailRow label="Εγγραφή">{formatDate(organization.createdAt)}</DetailRow>
              <DetailRow label="Καταστήματα">
                {organization.venues.length
                  ? organization.venues.map((v) => v.name).join(", ")
                  : "—"}
              </DetailRow>
              <DetailRow label="Χρήστες">{organization.users.length}</DetailRow>
            </dl>

            {organization.users.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-brand-surface text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Όνομα</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Ρόλος</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organization.users.map((user) => (
                      <tr key={user.email} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-brand-navy">{user.name}</td>
                        <td className="px-3 py-2 text-slate-600">{user.email}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <button
              type="button"
              disabled={saving || !profileDirty || !profileValid}
              className={buttonClass("primary", "sm")}
              onClick={() =>
                void save(
                  {
                    name: businessName.trim(),
                    adminEmail: adminEmail.trim(),
                    phone,
                    mobile,
                    vatNumber: vatNumber === "" ? null : vatNumber,
                    activity: activity === "" ? null : activity,
                    city,
                    notes,
                  },
                  "Αποθήκευση στοιχείων.",
                )
              }
            >
              {saving ? "Αποθήκευση…" : "Αποθήκευση στοιχείων"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-brand-surface/40 p-4 sm:grid-cols-2">
              <DetailRow label="Κατάσταση">{organization.status}</DetailRow>
              {organization.plan === "TRIAL" ? (
                <DetailRow label="Trial λήγει">{formatDate(organization.trialEndsAt)}</DetailRow>
              ) : null}
              <DetailRow label="Περίοδος έως">{formatDate(organization.currentPeriodEnd)}</DetailRow>
              <DetailRow label="Venues / Μενού / Πιάτα">
                {organization.venueCount} / {organization.menuCount} / {organization.itemCount}
              </DetailRow>
              <DetailRow label="Stripe">
                <div className="flex flex-wrap gap-3">
                  {organization.stripeCustomerId ? (
                    <a
                      href={stripeCustomerDashboardUrl(organization.stripeCustomerId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-blue hover:underline"
                    >
                      Πελάτης
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                  {organization.stripeSubId ? (
                    <a
                      href={stripeSubscriptionDashboardUrl(organization.stripeSubId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-blue hover:underline"
                    >
                      Συνδρομή
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </DetailRow>
            </dl>

            <label className="block text-sm">
              <span className={dashboardLabelClass}>Πακέτο</span>
              <select className={dashboardFieldClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="TRIAL">TRIAL</option>
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </label>
            {plan !== "TRIAL" ? (
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Λήξη περιόδου (YYYY-MM-DD)</span>
                <input
                  type="date"
                  className={dashboardFieldClass}
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Για ενεργή συνδρομή χωρίς Stripe — π.χ. 2030-12-31
                </p>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || plan === organization.plan}
                className={buttonClass("primary", "sm")}
                onClick={() => void save({ plan, status: planStatusForSave(plan) }, "Αποθήκευση πακέτου.")}
              >
                {saving ? "Αποθήκευση…" : "Αποθήκευση πακέτου"}
              </button>
              {plan !== "TRIAL" && periodEnd ? (
                <button
                  type="button"
                  disabled={saving}
                  className={buttonClass("secondary", "sm")}
                  onClick={() =>
                    void save(
                      {
                        plan,
                        status: "ACTIVE",
                        currentPeriodEnd: periodEnd,
                      },
                      "Ενημερώθηκε η ημερομηνία λήξης.",
                    )
                  }
                >
                  {saving ? "Αποθήκευση…" : "Αποθήκευση λήξης"}
                </button>
              ) : null}
            </div>
          </div>
        )}

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </Card>
    </div>
  );
}
