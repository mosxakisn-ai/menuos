"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import {
  DashboardPage,
  DashboardPageHeader,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import type { PlanCatalogEntry } from "@/lib/plan-catalog-types";
import { formatPlanPriceDisplay } from "@/lib/plan-catalog-types";
import {
  isPlanCatalogFieldEditable,
  planCatalogEditSummary,
  planCatalogFieldLockReason,
  planHasEditableLimits,
  planShowsTrialDays,
  type PlanCatalogEditableField,
} from "@/lib/plan-catalog-edit-policy";
import { formatTrialPeriodLabel } from "@/lib/trial-marketing";
import { cn } from "@/lib/utils";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

function formatLimit(value: number | null, unlimited = "Απεριόριστο") {
  return value === null ? unlimited : String(value);
}

function parseOptionalLimit(raw: string, options?: { allowZero?: boolean }): number | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return "invalid";
  const min = options?.allowZero ? 0 : 1;
  if (parsed < min) return "invalid";
  return parsed;
}

function formControlClass(locked: boolean, extra?: string) {
  return cn(dashboardFieldClass, "!mt-0", lockedFieldClass(locked), extra);
}

function formTextareaClass(locked: boolean, extra?: string) {
  return cn(
    dashboardFieldClass,
    "!mt-0 !h-auto",
    lockedFieldClass(locked),
    extra,
  );
}

function fieldLocked(planId: PlanCatalogEntry["id"], field: PlanCatalogEditableField) {
  return planCatalogFieldLockReason(planId, field);
}

function lockedFieldClass(locked: boolean) {
  return locked ? "cursor-not-allowed bg-slate-50 text-slate-500" : "";
}

function FieldHint({ reason }: { reason: string | null }) {
  if (!reason) return null;
  return <p className="mt-1 text-[11px] leading-snug text-slate-500">{reason}</p>;
}

function FormField({
  label,
  lockReason,
  className,
  children,
}: {
  label: string;
  lockReason?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex h-full min-w-0 flex-col text-sm", className)}>
      <span className={dashboardLabelClass}>{label}</span>
      <FieldHint reason={lockReason ?? null} />
      <div className="mt-auto pt-1.5">{children}</div>
    </label>
  );
}

function PlanEditor({
  plan,
  onClose,
  onSaved,
}: {
  plan: PlanCatalogEntry;
  onClose: () => void;
  onSaved: (updated: PlanCatalogEntry) => void;
}) {
  const [name, setName] = useState(plan.name);
  const [priceMonthly, setPriceMonthly] = useState(String(plan.priceMonthly));
  const [priceDisplay, setPriceDisplay] = useState(plan.priceDisplay ?? "");
  const [periodLabel, setPeriodLabel] = useState(plan.periodLabel);
  const [description, setDescription] = useState(plan.description ?? "");
  const [featuresText, setFeaturesText] = useState(plan.features.join("\n"));
  const [maxVenues, setMaxVenues] = useState(String(plan.maxVenues));
  const [maxMenus, setMaxMenus] = useState(plan.maxMenusPerVenue === null ? "" : String(plan.maxMenusPerVenue));
  const [maxItems, setMaxItems] = useState(plan.maxItems === null ? "" : String(plan.maxItems));
  const [maxGeminiTokens, setMaxGeminiTokens] = useState(
    plan.maxGeminiTokensPerMonth === null ? "" : String(plan.maxGeminiTokensPerMonth),
  );
  const [ctaLabel, setCtaLabel] = useState(plan.ctaLabel ?? "");
  const [badge, setBadge] = useState(plan.badge ?? "");
  const [highlighted, setHighlighted] = useState(plan.highlighted);
  const [visibleOnPricing, setVisibleOnPricing] = useState(plan.visibleOnPricing);
  const [trialDays, setTrialDays] = useState(plan.trialDays === null ? "" : String(plan.trialDays));
  const [sortOrder, setSortOrder] = useState(String(plan.sortOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const trialPeriodPreview =
    plan.id === "TRIAL" && trialDays.trim()
      ? formatTrialPeriodLabel(Number.parseInt(trialDays, 10) || plan.trialDays || 7)
      : plan.periodLabel;

  function canEdit(field: PlanCatalogEditableField) {
    return isPlanCatalogFieldEditable(plan.id, field);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const features = featuresText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!features.length) {
      setError("Πρόσθεσε τουλάχιστον ένα feature.");
      setSaving(false);
      return;
    }

    const parsedPrice = Number.parseFloat(priceMonthly.replace(",", "."));
    if (canEdit("priceMonthly") && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setError("Μη έγκυρη τιμή.");
      setSaving(false);
      return;
    }

    const parsedVenues = Number.parseInt(maxVenues, 10);
    if (canEdit("maxVenues") && (!Number.isFinite(parsedVenues) || parsedVenues < 1)) {
      setError("Μη έγκυρο όριο καταστημάτων.");
      setSaving(false);
      return;
    }

    const parsedMenus = parseOptionalLimit(maxMenus);
    if (canEdit("maxMenusPerVenue") && parsedMenus === "invalid") {
      setError("Μη έγκυρο όριο καταλόγων.");
      setSaving(false);
      return;
    }
    const parsedItems = parseOptionalLimit(maxItems);
    if (canEdit("maxItems") && parsedItems === "invalid") {
      setError("Μη έγκυρο όριο πιάτων.");
      setSaving(false);
      return;
    }
    const parsedGeminiTokens = parseOptionalLimit(maxGeminiTokens, { allowZero: true });
    if (canEdit("maxGeminiTokensPerMonth") && parsedGeminiTokens === "invalid") {
      setError("Μη έγκυρο όριο Gemini tokens.");
      setSaving(false);
      return;
    }
    let parsedTrialDays: number | null = null;
    if (canEdit("trialDays")) {
      if (!trialDays.trim()) {
        setError("Συμπλήρωσε τις ημέρες δοκιμής.");
        setSaving(false);
        return;
      }
      parsedTrialDays = Number.parseInt(trialDays, 10);
      if (!Number.isFinite(parsedTrialDays) || parsedTrialDays < 1) {
        setError("Μη έγκυρες ημέρες δοκιμής.");
        setSaving(false);
        return;
      }
    }

    try {
      const payload: Record<string, unknown> = {};
      if (canEdit("name")) payload.name = name.trim();
      if (canEdit("priceMonthly")) payload.priceMonthly = parsedPrice;
      if (canEdit("priceDisplay")) payload.priceDisplay = priceDisplay.trim() || null;
      if (canEdit("periodLabel")) payload.periodLabel = periodLabel.trim();
      if (canEdit("description")) payload.description = description.trim() || null;
      if (canEdit("features")) payload.features = features;
      if (canEdit("maxVenues")) payload.maxVenues = parsedVenues;
      if (canEdit("maxMenusPerVenue")) payload.maxMenusPerVenue = parsedMenus;
      if (canEdit("maxItems")) payload.maxItems = parsedItems;
      if (canEdit("maxGeminiTokensPerMonth")) payload.maxGeminiTokensPerMonth = parsedGeminiTokens;
      if (canEdit("ctaLabel")) payload.ctaLabel = ctaLabel.trim() || null;
      if (canEdit("badge")) payload.badge = badge.trim() || null;
      if (canEdit("highlighted")) payload.highlighted = highlighted;
      if (canEdit("visibleOnPricing")) payload.visibleOnPricing = visibleOnPricing;
      if (canEdit("trialDays")) payload.trialDays = parsedTrialDays;
      if (canEdit("sortOrder")) payload.sortOrder = Number.parseInt(sortOrder, 10) || 0;

      if (!Object.keys(payload).length) {
        setError("Δεν υπάρχουν επεξεργάσιμα πεδία.");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/supervisor/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { plan?: PlanCatalogEntry; error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία.");
        return;
      }
      setMessage(data.message ?? "Ενημερώθηκε.");
      if (data.plan) onSaved(data.plan);
    } catch {
      setError("Σφάλμα δικτύου.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center sm:p-6">
      <Card className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border-brand-blue/20 p-5 shadow-xl sm:p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{plan.id}</p>
            <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">Επεξεργασία πακέτου</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
          {planCatalogEditSummary(plan.id)}
        </p>

        <form onSubmit={(e) => void save(e)} className="mt-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy">Βασικά στοιχεία</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Όνομα εμφάνισης" lockReason={fieldLocked(plan.id, "name")} className="lg:col-span-4">
                <input
                  className={formControlClass(!canEdit("name"))}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planDisplayName}
                  required
                  disabled={!canEdit("name")}
                />
              </FormField>
              <FormField label="Τιμή / μήνα (€)" lockReason={fieldLocked(plan.id, "priceMonthly")}>
                <input
                  className={formControlClass(!canEdit("priceMonthly"))}
                  inputMode="decimal"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planPriceMonthly}
                  required
                  disabled={!canEdit("priceMonthly")}
                />
              </FormField>
              <FormField label="Εμφάνιση τιμής" lockReason={fieldLocked(plan.id, "priceDisplay")}>
                <input
                  className={formControlClass(!canEdit("priceDisplay"))}
                  placeholder="π.χ. €9.99"
                  value={priceDisplay}
                  onChange={(e) => setPriceDisplay(e.target.value)}
                  disabled={!canEdit("priceDisplay")}
                />
              </FormField>
              <FormField label="Περίοδος" lockReason={fieldLocked(plan.id, "periodLabel")}>
                <input
                  className={formControlClass(!canEdit("periodLabel"))}
                  placeholder="/μήνα ή / 7 ημέρες"
                  value={canEdit("periodLabel") ? periodLabel : trialPeriodPreview}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  required
                  disabled={!canEdit("periodLabel")}
                />
              </FormField>
              <FormField label="Σειρά εμφάνισης" lockReason={fieldLocked(plan.id, "sortOrder")}>
                <input
                  className={formControlClass(!canEdit("sortOrder"))}
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planSortOrder}
                  disabled={!canEdit("sortOrder")}
                />
              </FormField>
              <FormField label="Περιγραφή" lockReason={fieldLocked(plan.id, "description")} className="lg:col-span-4">
                <textarea
                  className={formTextareaClass(!canEdit("description"), "min-h-[80px] resize-y")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planDescription}
                  disabled={!canEdit("description")}
                />
              </FormField>
              <FormField
                label="Features (μία γραμμή = ένα feature)"
                lockReason={fieldLocked(plan.id, "features")}
                className="lg:col-span-4"
              >
                <textarea
                  className={formTextareaClass(
                    !canEdit("features"),
                    "min-h-[140px] resize-y font-mono text-xs leading-relaxed",
                  )}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planFeatures}
                  required
                  disabled={!canEdit("features")}
                />
              </FormField>
            </div>
          </section>

          {planHasEditableLimits(plan.id) ? (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">Όρια πλάνου</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Εφαρμόζονται στο προϊόν — όχι μόνο στο marketing κείμενο. Κενό = απεριόριστο.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <FormField label="Καταστήματα" lockReason={fieldLocked(plan.id, "maxVenues")}>
                  <input
                    className={formControlClass(!canEdit("maxVenues"))}
                    type="number"
                    min={1}
                    value={maxVenues}
                    onChange={(e) => setMaxVenues(e.target.value)}
                    placeholder={FORM_PLACEHOLDERS.maxVenues}
                    required={canEdit("maxVenues")}
                    disabled={!canEdit("maxVenues")}
                  />
                </FormField>
                <FormField label="Κατάλογοι / μαγαζί" lockReason={fieldLocked(plan.id, "maxMenusPerVenue")}>
                  <input
                    className={formControlClass(!canEdit("maxMenusPerVenue"))}
                    type="number"
                    min={1}
                    value={maxMenus}
                    onChange={(e) => setMaxMenus(e.target.value)}
                    disabled={!canEdit("maxMenusPerVenue")}
                  />
                </FormField>
                <FormField label="Είδη" lockReason={fieldLocked(plan.id, "maxItems")}>
                  <input
                    className={formControlClass(!canEdit("maxItems"))}
                    type="number"
                    min={1}
                    value={maxItems}
                    onChange={(e) => setMaxItems(e.target.value)}
                    disabled={!canEdit("maxItems")}
                  />
                </FormField>
                <FormField label="Gemini tokens / μήνα" lockReason={fieldLocked(plan.id, "maxGeminiTokensPerMonth")}>
                  <input
                    className={formControlClass(!canEdit("maxGeminiTokensPerMonth"))}
                    type="number"
                    min={0}
                    value={maxGeminiTokens}
                    onChange={(e) => setMaxGeminiTokens(e.target.value)}
                    placeholder="π.χ. 500000"
                    disabled={!canEdit("maxGeminiTokensPerMonth")}
                  />
                </FormField>
              </div>
            </section>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              {fieldLocked(plan.id, "maxVenues") ?? "Τα όρια δεν επεξεργάζονται από εδώ."}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-brand-navy">Marketing & εμφάνιση</h3>
            <div
              className={cn(
                "grid gap-4",
                planShowsTrialDays(plan.id) ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
              )}
            >
              <FormField label="Κουμπί CTA" lockReason={fieldLocked(plan.id, "ctaLabel")}>
                <input
                  className={formControlClass(!canEdit("ctaLabel"))}
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planCta}
                  disabled={!canEdit("ctaLabel")}
                />
              </FormField>
              <FormField label="Badge (π.χ. Δημοφιλές)" lockReason={fieldLocked(plan.id, "badge")}>
                <input
                  className={formControlClass(!canEdit("badge"))}
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.planBadge}
                  disabled={!canEdit("badge")}
                />
              </FormField>
              {planShowsTrialDays(plan.id) ? (
                <FormField label="Ημέρες δοκιμής" lockReason={fieldLocked(plan.id, "trialDays")}>
                  <input
                    className={formControlClass(!canEdit("trialDays"))}
                    type="number"
                    min={1}
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    placeholder={FORM_PLACEHOLDERS.trialDays}
                    disabled={!canEdit("trialDays")}
                  />
                </FormField>
              ) : null}
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <label className={cn("inline-flex items-center gap-2.5", !canEdit("highlighted") && "opacity-50")}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={highlighted}
                  onChange={(e) => setHighlighted(e.target.checked)}
                  disabled={!canEdit("highlighted")}
                />
                <span>Επισημασμένο (Δημοφιλές)</span>
              </label>
              <label className={cn("inline-flex items-center gap-2.5", !canEdit("visibleOnPricing") && "opacity-50")}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={visibleOnPricing}
                  onChange={(e) => setVisibleOnPricing(e.target.checked)}
                  disabled={!canEdit("visibleOnPricing")}
                />
                <span>Εμφάνιση στη σελίδα τιμών</span>
              </label>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button type="button" className={buttonClass("secondary")} onClick={onClose}>
                Κλείσιμο
              </button>
              <button type="submit" className={buttonClass("primary")} disabled={saving}>
                {saving ? "Αποθήκευση…" : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function SupervisorPlansClient() {
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<PlanCatalogEntry | null>(null);
  const [editorSeed, setEditorSeed] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/supervisor/plans", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { plans: PlanCatalogEntry[] };
      setPlans(data.plans);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardPage wide className="max-w-none">
      <DashboardPageHeader
        title="Πακέτα συνδρομής"
        description={
          loading
            ? "Φόρτωση…"
            : `${plans.length} πακέτα · τιμές, περιγραφές και όρια για billing και marketing`
        }
      />

      {error ? (
        <p className="text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Φόρτωση…</p>
      ) : plans.length ? (
        <>
          <div className="overflow-x-auto rounded-card border border-slate-200 bg-white shadow-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-brand-surface text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-12 px-3 py-3">#</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Όνομα</th>
                  <th className="px-4 py-3">Τιμή</th>
                  <th className="px-4 py-3">Περιγραφή</th>
                  <th className="px-4 py-3">Όρια</th>
                  <th className="px-4 py-3">Features</th>
                  <th className="px-4 py-3">Marketing</th>
                  <th className="px-4 py-3 text-right">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, index) => (
                  <tr
                    key={plan.id}
                    className={cn(
                      "border-b border-slate-50 last:border-0 hover:bg-brand-blue/5",
                      editing?.id === plan.id && "bg-brand-blue/10",
                    )}
                  >
                    <td className="px-3 py-3 font-medium tabular-nums text-slate-400">#{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{plan.id}</td>
                    <td className="px-4 py-3 font-medium text-brand-navy">{plan.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatPlanPriceDisplay(plan.priceMonthly, plan.priceDisplay)}
                      <span className="text-xs text-slate-400">{plan.periodLabel}</span>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-slate-600">
                      <p className="line-clamp-2">{plan.description ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p>{plan.maxVenues} κατ.</p>
                      <p>{formatLimit(plan.maxMenusPerVenue)} cat.</p>
                      <p>{formatLimit(plan.maxItems)} είδη</p>
                      <p>
                        Gemini:{" "}
                        {plan.maxGeminiTokensPerMonth === null
                          ? "∞"
                          : `${Math.round(plan.maxGeminiTokensPerMonth / 1000)}k tokens/μήνα`}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{plan.features.length}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {plan.highlighted ? <span className="text-brand-blue">Επισημασμένο</span> : "—"}
                      {plan.badge ? <p>{plan.badge}</p> : null}
                      {plan.visibleOnPricing ? null : <p className="text-slate-400">Όχι pricing</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className={buttonClass("secondary", "sm")}
                        onClick={() => setEditing(plan)}
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
            <PlanEditor
              key={`${editing.id}:${editorSeed}`}
              plan={editing}
              onClose={() => setEditing(null)}
              onSaved={(updated) => {
                setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                setEditing(updated);
                setEditorSeed((seed) => seed + 1);
              }}
            />
          ) : null}
        </>
      ) : (
        <Card className="border-brand-blue/10">
          <p className="text-sm text-slate-600">Δεν βρέθηκαν πακέτα.</p>
        </Card>
      )}
    </DashboardPage>
  );
}
