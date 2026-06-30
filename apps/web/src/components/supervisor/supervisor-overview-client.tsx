"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import type { SupervisorOverview } from "@/lib/supervisor-service";

export function SupervisorOverviewClient() {
  const [data, setData] = useState<SupervisorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/supervisor/overview", { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <p className="text-sm text-red-600">Αποτυχία φόρτωσης στατιστικών.</p>;
  }

  const stats = [
    { label: "Πελάτες (real)", value: data?.organizationsReal },
    { label: "Εγγραφές 7 ημέρες", value: data?.signupsLast7Days },
    { label: "Εγγραφές 30 ημέρες", value: data?.signupsLast30Days },
    { label: "Ενεργά trials", value: data?.trialActive },
    { label: "Πληρωμένες ενεργές", value: data?.paidActive },
    { label: "Past due", value: data?.pastDue },
    { label: "Ακυρωμένες", value: data?.canceled },
    { label: "Trials ≤7 μέρες", value: data?.trialsExpiring7Days },
    { label: "Εκτιμ. MRR (€)", value: data?.estimatedMrr?.toFixed(2) },
    { label: "Καταστήματα", value: data?.totalVenues },
    { label: "Πιάτα (σύνολο)", value: data?.totalItems },
    { label: "Orgs (σύνολο + demo)", value: data?.organizations },
  ];

  return (
    <DashboardPage wide>
      <DashboardPageHeader
        title="Αρχική"
        description="Γενική εικόνα πλατφόρμας MenuOS — χωρίς demo venue στα KPI πελατών."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value }) => (
          <Card key={label} className="border-brand-blue/10 p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 font-serif text-3xl font-bold text-brand-navy">
              {loading ? "…" : (value ?? 0)}
            </p>
          </Card>
        ))}
      </div>
      {data?.byPlan ? (
        <Card className="border-brand-blue/10">
          <h2 className="font-semibold text-brand-navy">Ανά πακέτο (real orgs)</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(data.byPlan).map(([plan, count]) => (
              <span
                key={plan}
                className="rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-sm font-medium text-brand-navy"
              >
                {plan}: {count}
              </span>
            ))}
          </div>
        </Card>
      ) : null}
    </DashboardPage>
  );
}
