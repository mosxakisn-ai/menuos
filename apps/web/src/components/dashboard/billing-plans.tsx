"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAID_SUBSCRIPTION_PLANS } from "@menuos/shared";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import type { PlanCatalogEntry } from "@/lib/plan-catalog-types";
import { formatPlanPriceDisplay } from "@/lib/plan-catalog-types";

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

const STATUS_GR: Record<string, string> = {
  TRIALING: "Δοκιμή",
  ACTIVE: "Ενεργή",
  PAST_DUE: "Καθυστέρηση πληρωμής",
  CANCELED: "Ακυρωμένη",
};

function planChangeButtonLabel(
  currentPlanId: string,
  targetPlanId: (typeof PAID_SUBSCRIPTION_PLANS)[number],
  plansById: Record<string, PlanCatalogEntry>,
): string {
  const target = plansById[targetPlanId];
  const currentPrice = plansById[currentPlanId]?.priceMonthly ?? 0;
  if (!target) return `Επιλογή ${targetPlanId}`;
  if (target.priceMonthly > currentPrice) return `Αναβάθμιση σε ${target.name}`;
  if (target.priceMonthly < currentPrice) return `Υποβάθμιση σε ${target.name}`;
  return `Επιλογή ${target.name}`;
}

export function BillingPlans({
  organizationId: _organizationId,
  subscription,
  userRole,
  plans,
  enterprisePlan,
}: {
  organizationId: string;
  subscription: Subscription | null;
  userRole?: string;
  plans: PlanCatalogEntry[];
  enterprisePlan: PlanCatalogEntry | null;
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plansById = Object.fromEntries(plans.map((p) => [p.id, p]));

  async function checkout(planId: string) {
    setLoadingPlan(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, returnPath: "/dashboard/billing" }),
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
        mode?: string;
      };
      if (!res.ok) {
        setError(data.error ?? DASHBOARD_EL.billing.checkoutFailed);
        return;
      }
      if (data.checkoutUrl) {
        if (data.mode === "mock") {
          router.push(data.checkoutUrl);
          router.refresh();
          return;
        }
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Σφάλμα δικτύου");
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = subscription?.plan ?? "TRIAL";
  const statusLabel = STATUS_GR[subscription?.status ?? "TRIALING"] ?? subscription?.status ?? "Δοκιμή";
  const canCheckout = userRole !== "STAFF";
  const currentPlanEntry = plansById[currentPlan];

  return (
    <div className="space-y-6">
      {!canCheckout ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {DASHBOARD_EL.billing.staffNoCheckout}
        </div>
      ) : null}
      <Card>
        <h2 className="font-semibold text-primary">Τρέχον πλάνο</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-primary">{currentPlanEntry?.name ?? currentPlan}</span>
          {" · "}
          Κατάσταση: {statusLabel}
        </p>
        {subscription?.trialEndsAt && currentPlan === "TRIAL" && (
          <p className="mt-1 text-sm text-slate-500">
            Δοκιμή έως: {new Date(subscription.trialEndsAt).toLocaleDateString("el-GR")}
          </p>
        )}
        {subscription?.currentPeriodEnd && currentPlan !== "TRIAL" && (
          <p className="mt-1 text-sm text-slate-500">
            Τρέχουσα περίοδος έως:{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString("el-GR")}
          </p>
        )}
      </Card>

      {error && (
        <div className="rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {PAID_SUBSCRIPTION_PLANS.map((planId) => {
          const plan = plansById[planId];
          if (!plan) return null;
          const isCurrent = currentPlan === planId;
          return (
            <Card key={planId} className={isCurrent ? "ring-2 ring-brand-blue/30" : ""}>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue/70">
                {plan.name}
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">
                {formatPlanPriceDisplay(plan.priceMonthly, plan.priceDisplay)}
                <span className="text-base font-normal text-slate-500">{plan.periodLabel}</span>
              </p>
              {plan.description ? (
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              ) : null}
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || loadingPlan === planId || !canCheckout}
                onClick={() => checkout(planId)}
                className={`mt-6 w-full ${buttonClass(isCurrent ? "secondary" : "primary")}`}
              >
                {loadingPlan === planId
                  ? "Μετάβαση..."
                  : isCurrent
                    ? "Τρέχον πλάνο"
                    : planChangeButtonLabel(currentPlan, planId, plansById)}
              </button>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="font-semibold text-primary">{enterprisePlan?.name ?? "Enterprise"}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {enterprisePlan?.description ??
            "Custom domain, white-label και προτεραιότητα υποστήριξης."}{" "}
          Γράψε μας στο{" "}
          <a href="mailto:info@b-os.gr" className="text-brand-blue hover:underline">
            info@b-os.gr
          </a>
        </p>
      </Card>
    </div>
  );
}
