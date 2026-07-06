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

function parseOptionalLimit(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return "invalid";
  return parsed;
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
    const parsedGeminiTokens = parseOptionalLimit(maxGeminiTokens);
    if (canEdit("maxGeminiTokensPerMonth") && parsedGeminiTokens === "invalid") {
      setError("Μη έγκυρο όριο Gemini tokens.");
      setSaving(false);
      return;
    }
    let parsedTrialDays: number | null = null;
    if (canEdit("trialDays") && trialDays.trim()) {
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
      if (!Object.keys(payload).length) {
        setError("Δεν υπάρχουν επεξεργάσιμα πεδία.");
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-brand-blue/20 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{plan.id}</p>
            <h2 className="text-xl font-bold text-brand-navy">Επεξεργασία πακέτου</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Κλείσιμο"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {planCatalogEditSummary(plan.id)}
        </p>

        <form onSubmit={(e) => void save(e)} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className={dashboardLabelClass}>Όνομα εμφάνισης</span>
              <FieldHint reason={fieldLocked(plan.id, "name")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("name")))}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planDisplayName}
                required
                disabled={!canEdit("name")}
              />
            </label>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Τιμή / μήνα (€)</span>
              <FieldHint reason={fieldLocked(plan.id, "priceMonthly")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("priceMonthly")))}
                inputMode="decimal"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planPriceMonthly}
                required
                disabled={!canEdit("priceMonthly")}
              />
            </label>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Εμφάνιση τιμής (προαιρετικό)</span>
              <FieldHint reason={fieldLocked(plan.id, "priceDisplay")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("priceDisplay")))}
                placeholder="π.χ. €9.99"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                disabled={!canEdit("priceDisplay")}
              />
            </label>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Περίοδος</span>
              <FieldHint reason={fieldLocked(plan.id, "periodLabel")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("periodLabel")))}
                placeholder="/μήνα ή / 7 ημέρες"
                value={canEdit("periodLabel") ? periodLabel : trialPeriodPreview}
                onChange={(e) => setPeriodLabel(e.target.value)}
                required
                disabled={!canEdit("periodLabel")}
              />
            </label>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Σειρά εμφάνισης</span>
              <FieldHint reason={fieldLocked(plan.id, "sortOrder")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("sortOrder")))}
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planSortOrder}
                disabled={!canEdit("sortOrder")}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className={dashboardLabelClass}>Περιγραφή</span>
              <FieldHint reason={fieldLocked(plan.id, "description")} />
              <textarea
                className={cn(dashboardFieldClass, "min-h-[72px] resize-y", lockedFieldClass(!canEdit("description")))}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planDescription}
                disabled={!canEdit("description")}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className={dashboardLabelClass}>Features (μία γραμμή = ένα feature)</span>
              <FieldHint reason={fieldLocked(plan.id, "features")} />
              <textarea
                className={cn(
                  dashboardFieldClass,
                  "min-h-[140px] resize-y font-mono text-xs",
                  lockedFieldClass(!canEdit("features")),
                )}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planFeatures}
                required
                disabled={!canEdit("features")}
              />
            </label>
          </div>

          {planHasEditableLimits(plan.id) ? (
            <div>
              <p className={dashboardLabelClass}>Όρια πλάνου</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Αυτά εφαρμόζονται στο προϊόν — όχι μόνο στο marketing κείμενο.
              </p>
              <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-sm">
                  <span className="text-xs text-slate-500">Καταστήματα</span>
                  <FieldHint reason={fieldLocked(plan.id, "maxVenues")} />
                  <input
                    className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("maxVenues")))}
                    type="number"
                    min={1}
                    value={maxVenues}
                    onChange={(e) => setMaxVenues(e.target.value)}
                    placeholder={FORM_PLACEHOLDERS.maxVenues}
                    required={canEdit("maxVenues")}
                    disabled={!canEdit("maxVenues")}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs text-slate-500">Κατάλογοι / μαγαζί (κενό = απεριόριστο)</span>
                  <FieldHint reason={fieldLocked(plan.id, "maxMenusPerVenue")} />
                  <input
                    className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("maxMenusPerVenue")))}
                    type="number"
                    min={1}
                    value={maxMenus}
                    onChange={(e) => setMaxMenus(e.target.value)}
                    disabled={!canEdit("maxMenusPerVenue")}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs text-slate-500">Πιάτα (κενό = απεριόριστο)</span>
                  <FieldHint reason={fieldLocked(plan.id, "maxItems")} />
                  <input
                    className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("maxItems")))}
                    type="number"
                    min={1}
                    value={maxItems}
                    onChange={(e) => setMaxItems(e.target.value)}
                    disabled={!canEdit("maxItems")}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs text-slate-500">Gemini tokens/μήνα (κενό = απεριόριστο)</span>
                  <FieldHint reason={fieldLocked(plan.id, "maxGeminiTokensPerMonth")} />
                  <input
                    className={cn(
                      dashboardFieldClass,
                      lockedFieldClass(!canEdit("maxGeminiTokensPerMonth")),
                    )}
                    type="number"
                    min={0}
                    value={maxGeminiTokens}
                    onChange={(e) => setMaxGeminiTokens(e.target.value)}
                    placeholder="π.χ. 500000"
                    disabled={!canEdit("maxGeminiTokensPerMonth")}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {fieldLocked(plan.id, "maxVenues") ?? "Τα όρια δεν επεξεργάζονται από εδώ."}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Κουμπί CTA</span>
              <FieldHint reason={fieldLocked(plan.id, "ctaLabel")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("ctaLabel")))}
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planCta}
                disabled={!canEdit("ctaLabel")}
              />
            </label>
            <label className="block text-sm">
              <span className={dashboardLabelClass}>Badge (π.χ. Δημοφιλές)</span>
              <FieldHint reason={fieldLocked(plan.id, "badge")} />
              <input
                className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("badge")))}
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.planBadge}
                disabled={!canEdit("badge")}
              />
            </label>
            {planShowsTrialDays(plan.id) ? (
              <label className="block text-sm">
                <span className={dashboardLabelClass}>Ημέρες δοκιμής</span>
                <FieldHint reason={fieldLocked(plan.id, "trialDays")} />
                <input
                  className={cn(dashboardFieldClass, lockedFieldClass(!canEdit("trialDays")))}
                  type="number"
                  min={1}
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  placeholder={FORM_PLACEHOLDERS.trialDays}
                  disabled={!canEdit("trialDays")}
                />
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className={cn("inline-flex items-center gap-2", !canEdit("highlighted") && "opacity-50")}>
              <input
                type="checkbox"
                checked={highlighted}
                onChange={(e) => setHighlighted(e.target.checked)}
                disabled={!canEdit("highlighted")}
              />
              <span>Επισημασμένο (Δημοφιλές)</span>
            </label>
            <label className={cn("inline-flex items-center gap-2", !canEdit("visibleOnPricing") && "opacity-50")}>
              <input
                type="checkbox"
                checked={visibleOnPricing}
                onChange={(e) => setVisibleOnPricing(e.target.checked)}
                disabled={!canEdit("visibleOnPricing")}
              />
              <span>Εμφάνιση στη σελίδα τιμών</span>
            </label>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" className={buttonClass("secondary")} onClick={onClose}>
              Κλείσιμο
            </button>
            <button type="submit" className={buttonClass("primary")} disabled={saving}>
              {saving ? "Αποθήκευση…" : "Αποθήκευση"}
            </button>
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
    <DashboardPage wide>
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
                      <p>{formatLimit(plan.maxItems)} πιάτα</p>
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
              plan={editing}
              onClose={() => setEditing(null)}
              onSaved={(updated) => {
                setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                setEditing(updated);
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
