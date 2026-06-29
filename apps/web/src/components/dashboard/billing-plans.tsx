"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_DEFINITIONS, PAID_SUBSCRIPTION_PLANS } from "@menuos/shared";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

type Subscription = {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export function BillingPlans({
  organizationId,
  subscription,
}: {
  organizationId: string;
  subscription: Subscription | null;
}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error ?? "Checkout failed");
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
      setError("Network error");
    } finally {
      setLoadingPlan(null);
    }
  }

  const currentPlan = subscription?.plan ?? "TRIAL";

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold text-primary">Current plan</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-primary">{PLAN_DEFINITIONS[currentPlan as keyof typeof PLAN_DEFINITIONS]?.name ?? currentPlan}</span>
          {" · "}
          Status: {subscription?.status ?? "TRIALING"}
        </p>
        {subscription?.trialEndsAt && currentPlan === "TRIAL" && (
          <p className="mt-1 text-sm text-slate-500">
            Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString("el-GR")}
          </p>
        )}
        {subscription?.currentPeriodEnd && currentPlan !== "TRIAL" && (
          <p className="mt-1 text-sm text-slate-500">
            Current period ends:{" "}
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
          const plan = PLAN_DEFINITIONS[planId];
          const isCurrent = currentPlan === planId;
          return (
            <Card key={planId} className={isCurrent ? "ring-2 ring-brand-blue/30" : ""}>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue/70">
                {plan.name}
              </p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">
                €{plan.priceMonthly}
                <span className="text-base font-normal text-slate-500">/month</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || loadingPlan === planId}
                onClick={() => checkout(planId)}
                className={`mt-6 w-full ${buttonClass(isCurrent ? "secondary" : "primary")}`}
              >
                {loadingPlan === planId
                  ? "Redirecting…"
                  : isCurrent
                    ? "Current plan"
                    : `Upgrade to ${plan.name}`}
              </button>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="font-semibold text-primary">Enterprise</h3>
        <p className="mt-2 text-sm text-slate-600">
          Custom domain, white-label, and priority support. Contact us at{" "}
          <a href="mailto:info@b-os.gr" className="text-brand-blue hover:underline">
            info@b-os.gr
          </a>
        </p>
      </Card>
    </div>
  );
}
