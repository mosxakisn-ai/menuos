"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PAID_SUBSCRIPTION_PLANS } from "@menuos/shared";
import { DashboardFeatureCheck, DashboardStatusDot } from "@/components/dashboard/dashboard-ui";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import type { PlanCatalogEntry } from "@/lib/plan-catalog-types";
import { formatPlanPriceDisplay } from "@/lib/plan-catalog-types";
import { displayPlanFeature } from "@/lib/plan-feature-display";
import { formatDashboardDate } from "@/content/dashboard-i18n";
import type { SubscriptionDisplaySummary } from "@/lib/subscription-display";
import { getVisitorSessionId, bumpVisitorIntentStep } from "@/lib/visitor-intent-client";
import { cn } from "@/lib/utils";

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

function planChangeButtonLabel(
  currentPlanId: string,
  targetPlanId: (typeof PAID_SUBSCRIPTION_PLANS)[number],
  plansById: Record<string, PlanCatalogEntry>,
  d: ReturnType<typeof useDashboardCopy>["d"],
): string {
  const target = plansById[targetPlanId];
  const currentPrice = plansById[currentPlanId]?.priceMonthly ?? 0;
  if (!target) return d.billing.selectPlan(targetPlanId);
  if (target.priceMonthly > currentPrice) return d.billing.upgradeTo(target.name);
  if (target.priceMonthly < currentPrice) return d.billing.downgradeTo(target.name);
  return d.billing.selectPlan(target.name);
}

export function BillingPlans({
  organizationId: _organizationId,
  subscription,
  subscriptionAccessActive,
  subscriptionSummary,
  userRole,
  userEmail,
  plans,
  enterprisePlan,
}: {
  organizationId: string;
  subscription: Subscription | null;
  subscriptionAccessActive: boolean;
  subscriptionSummary: SubscriptionDisplaySummary;
  userRole?: string;
  userEmail?: string;
  plans: PlanCatalogEntry[];
  enterprisePlan: PlanCatalogEntry | null;
}) {
  const { d, lang } = useDashboardCopy();
  const B = d.billing;
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plansById = Object.fromEntries(plans.map((p) => [p.id, p]));

  async function checkout(planId: string) {
    setLoadingPlan(planId);
    setError(null);
    const visitorLabel = userEmail?.trim() || undefined;
    const visitorSid = getVisitorSessionId();
    bumpVisitorIntentStep({
      surface: "checkout",
      step: "pay_clicked",
      path: "/dashboard/billing",
      planId,
      visitorLabel,
    });
    let keepLoading = false;
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          returnPath: "/dashboard/billing",
          visitorSid,
        }),
      });
      const data = (await res.json()) as {
        checkoutUrl?: string;
        error?: string;
        mode?: string;
      };
      if (!res.ok) {
        setError(data.error ?? B.checkoutFailed);
        bumpVisitorIntentStep({
          surface: "checkout",
          step: "stripe_init_failed",
          path: "/dashboard/billing",
          planId,
          visitorLabel,
        });
        return;
      }
      if (data.checkoutUrl) {
        if (data.mode === "mock") {
          bumpVisitorIntentStep({
            surface: "checkout",
            step: "payment_success",
            path: "/dashboard/billing",
            planId,
            visitorLabel,
          });
          router.push(data.checkoutUrl);
          router.refresh();
          return;
        }
        bumpVisitorIntentStep({
          surface: "checkout",
          step: "stripe_redirect",
          path: "/dashboard/billing",
          planId,
          visitorLabel,
        });
        keepLoading = true;
        window.location.href = data.checkoutUrl;
        return;
      }
      setError(B.checkoutFailed);
    } catch {
      setError(B.networkError);
      bumpVisitorIntentStep({
        surface: "checkout",
        step: "stripe_init_failed",
        path: "/dashboard/billing",
        planId,
        visitorLabel,
      });
    } finally {
      if (!keepLoading) setLoadingPlan(null);
    }
  }

  const currentPlan = subscription?.plan ?? "TRIAL";
  const canCheckout = userRole !== "STAFF";
  const currentPlanEntry = plansById[currentPlan];

  return (
    <div className="space-y-6">
      {!canCheckout ? (
        <div className="rounded-card border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {B.staffNoCheckout}
        </div>
      ) : null}

      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{B.currentPlan}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-primary">
              {currentPlanEntry?.name ?? currentPlan}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
            <DashboardStatusDot active={subscriptionAccessActive} />
            <span className="text-slate-600">
              {B.statusLabel}:{" "}
              <span className="font-semibold text-primary">{subscriptionSummary.statusLine}</span>
            </span>
          </div>
        </div>
        {subscriptionSummary.expiryLine ? (
          <p className="mt-3 text-sm text-slate-500">{subscriptionSummary.expiryLine}</p>
        ) : subscription?.trialEndsAt && currentPlan === "TRIAL" ? (
          <p className="mt-3 text-sm text-slate-500">
            {B.trialUntil}: {formatDashboardDate(lang, new Date(subscription.trialEndsAt))}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {PAID_SUBSCRIPTION_PLANS.map((planId) => {
          const plan = plansById[planId];
          if (!plan) return null;
          const isCurrent = currentPlan === planId;
          const isPro = planId === "PRO";
          return (
            <div
              key={planId}
              className={cn(
                "premium-card relative flex flex-col p-5 sm:p-6",
                isCurrent && "ring-2 ring-brand-blue/35",
                isPro && !isCurrent && "border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.03] to-brand-cyan/[0.04]",
              )}
            >
              {isPro ? (
                <ProBadge size="sm" className="absolute right-4 top-4 shadow-glow" />
              ) : null}
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue/80">{plan.name}</p>
              <p className="mt-3 font-serif text-3xl font-bold tabular-nums text-primary">
                {formatPlanPriceDisplay(plan.priceMonthly, plan.priceDisplay)}
                <span className="text-base font-normal text-slate-500">{B.perMonth}</span>
              </p>
              {plan.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.description}</p>
              ) : null}
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <DashboardFeatureCheck />
                    <span>{displayPlanFeature(f, lang)}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || loadingPlan === planId || !canCheckout}
                onClick={() => checkout(planId)}
                className={cn("mt-6 w-full", buttonClass(isCurrent ? "secondary" : "primary"))}
              >
                {loadingPlan === planId
                  ? B.checkoutLoading
                  : isCurrent
                    ? B.currentPlanBtn
                    : planChangeButtonLabel(currentPlan, planId, plansById, d)}
              </button>
            </div>
          );
        })}
      </div>

      <div className="premium-card p-5 sm:p-6">
        <h3 className="font-semibold text-primary">{enterprisePlan?.name ?? "Enterprise"}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {enterprisePlan?.description ?? B.enterpriseFallback}{" "}
          {B.contactUs}{" "}
          <a href="mailto:info@qrmenus.info" className="font-semibold text-brand-blue hover:underline">
            info@qrmenus.info
          </a>
        </p>
      </div>
    </div>
  );
}
