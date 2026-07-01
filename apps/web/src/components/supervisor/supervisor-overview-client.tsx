"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CreditCard,
  RefreshCw,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import type { SupervisorOrganizationRow, SupervisorOverview } from "@/lib/supervisor-service";
import { cn } from "@/lib/utils";

const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-500",
  BASIC: "bg-brand-blue",
  PRO: "bg-indigo-500",
  ENTERPRISE: "bg-slate-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Building2;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden border-white/80 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] blur-2xl transition group-hover:opacity-20",
          accent,
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p
            className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand-navy"
          >
            {loading ? "…" : value}
          </p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm",
            accent,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", tone)}>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{value}</p>
    </div>
  );
}

function greetingFirstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function SupervisorOverviewClient() {
  const [data, setData] = useState<SupervisorOverview | null>(null);
  const [recentOrgs, setRecentOrgs] = useState<SupervisorOrganizationRow[]>([]);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [overviewRes, orgsRes, meRes] = await Promise.all([
        fetch("/api/supervisor/overview", { credentials: "same-origin" }),
        fetch("/api/supervisor/organizations", { credentials: "same-origin" }),
        fetch("/api/supervisor/me", { credentials: "same-origin" }),
      ]);
      if (!overviewRes.ok) throw new Error("failed");
      setData(await overviewRes.json());
      if (orgsRes.ok) {
        const orgData = (await orgsRes.json()) as { organizations: SupervisorOrganizationRow[] };
        setRecentOrgs(orgData.organizations.filter((o) => !o.isDemo).slice(0, 5));
      }
      if (meRes.ok) {
        const me = (await meRes.json()) as { name?: string | null };
        if (me.name?.trim()) setOperatorName(greetingFirstName(me.name));
      }
      setUpdatedAt(new Date());
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
    return (
      <DashboardPage wide>
        <Card className="border-red-100 bg-red-50/50 p-6">
          <p className="text-sm text-red-700">Αποτυχία φόρτωσης στατιστικών.</p>
          <button type="button" className={`mt-4 ${buttonClass("secondary", "sm")}`} onClick={() => void load()}>
            Δοκίμασε ξανά
          </button>
        </Card>
      </DashboardPage>
    );
  }

  const planEntries = Object.entries(data?.byPlan ?? {}).sort((a, b) => b[1] - a[1]);
  const planTotal = planEntries.reduce((sum, [, n]) => sum + n, 0) || 1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Καλημέρα" : hour < 18 ? "Καλό απόγευμα" : "Καλησπέρα";

  const quickLinks = [
    { href: "/supervisor/organizations", label: "Πελάτες", desc: "CRM & συνδρομές", icon: Building2 },
    { href: "/supervisor/subscriptions", label: "Πακέτα", desc: "Τιμές & features", icon: CreditCard },
    { href: "/supervisor/users", label: "Ομάδα Ops", desc: "Πρόσβαση supervisor", icon: Users },
  ];

  return (
    <DashboardPage wide className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-blue/80">MenuOS Ops</p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            {operatorName ? `${greeting}, ${operatorName}` : greeting}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Επισκόπηση πλατφόρμας — πελάτες, έσοδα και κατάσταση συνδρομών (χωρίς demo).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt ? (
            <p className="text-xs text-slate-400">
              Ενημέρωση {updatedAt.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={cn(buttonClass("secondary", "sm"), "gap-2")}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Ανανέωση
          </button>
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand-navy via-slate-800 to-brand-navy p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-brand-blue/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300/90">Μηνιαία επανάληψη</p>
            <p className="mt-2 font-serif text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
              {loading ? "…" : `€${(data?.estimatedMrr ?? 0).toFixed(2)}`}
            </p>
            <p className="mt-2 text-sm text-slate-300">MRR από ενεργές πληρωμένες συνδρομές</p>
          </div>
          <div className="flex gap-6 sm:text-right">
            <div>
              <p className="text-2xl font-bold tabular-nums">{loading ? "…" : data?.paidActive ?? 0}</p>
              <p className="text-xs text-slate-400">Πληρωμένες</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{loading ? "…" : data?.organizationsReal ?? 0}</p>
              <p className="text-xs text-slate-400">Πελάτες</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Πελάτες"
          value={data?.organizationsReal ?? 0}
          sub={`+${data?.signupsLast7Days ?? 0} τελευταίες 7 μέρες`}
          icon={Building2}
          accent="bg-gradient-to-br from-brand-blue to-cyan-500"
          loading={loading}
        />
        <KpiCard
          label="Εγγραφές 30 ημερών"
          value={data?.signupsLast30Days ?? 0}
          sub={`${data?.trialsExpiring7Days ?? 0} trials ≤7 μέρες`}
          icon={UserPlus}
          accent="bg-gradient-to-br from-orange-500 to-amber-500"
          loading={loading}
        />
        <KpiCard
          label="Ενεργές δοκιμές"
          value={data?.trialActive ?? 0}
          sub="TRIAL πακέτο"
          icon={CreditCard}
          accent="bg-gradient-to-br from-amber-400 to-orange-500"
          loading={loading}
        />
        <KpiCard
          label="Καταστήματα / Πιάτα"
          value={`${data?.totalVenues ?? 0} / ${data?.totalItems ?? 0}`}
          sub="Σε όλη την πλατφόρμα"
          icon={UtensilsCrossed}
          accent="bg-gradient-to-br from-indigo-500 to-violet-600"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-white/80 p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-brand-navy">Κατάσταση συνδρομών</h2>
              <p className="mt-1 text-sm text-slate-500">Live breakdown χωρίς demo λογαριασμούς</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusPill
              label="Ενεργές δοκιμές"
              value={data?.trialActive ?? 0}
              tone="border-amber-100 bg-amber-50/80"
            />
            <StatusPill
              label="Πληρωμένες"
              value={data?.paidActive ?? 0}
              tone="border-emerald-100 bg-emerald-50/80"
            />
            <StatusPill
              label="Καθυστέρηση"
              value={data?.pastDue ?? 0}
              tone="border-orange-100 bg-orange-50/80"
            />
            <StatusPill
              label="Ακυρωμένες"
              value={data?.canceled ?? 0}
              tone="border-slate-200 bg-slate-50"
            />
          </div>

          {planEntries.length > 0 ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-brand-navy">Ανά πακέτο</h3>
              <div className="mt-4 space-y-4">
                {planEntries.map(([plan, count]) => {
                  const pct = Math.round((count / planTotal) * 100);
                  return (
                    <div key={plan}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-brand-navy">{plan}</span>
                        <span className="tabular-nums text-slate-500">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", PLAN_COLORS[plan] ?? "bg-brand-blue")}
                          style={{ width: loading ? "0%" : `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="border-white/80 p-6 shadow-card">
          <h2 className="font-semibold text-brand-navy">Πλατφόρμα</h2>
          <p className="mt-1 text-sm text-slate-500">Χρήση προϊόντος</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-brand-surface/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Building2 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-brand-navy">{data?.totalVenues ?? 0}</p>
                <p className="text-xs text-slate-500">Καταστήματα</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-brand-surface/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <UtensilsCrossed className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-brand-navy">{data?.totalItems ?? 0}</p>
                <p className="text-xs text-slate-500">Πιάτα σε menus</p>
              </div>
            </div>
          </div>

          {(data?.pastDue ?? 0) > 0 || (data?.trialsExpiring7Days ?? 0) > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                <div className="text-sm text-amber-900">
                  {(data?.trialsExpiring7Days ?? 0) > 0 ? (
                    <p>{data!.trialsExpiring7Days} δοκιμές λήγουν σύντομα.</p>
                  ) : null}
                  {(data?.pastDue ?? 0) > 0 ? (
                    <p>{data!.pastDue} συνδρομές σε καθυστέρηση πληρωμής.</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-white/80 p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-brand-navy">Πρόσφατοι πελάτες</h2>
              <p className="mt-1 text-sm text-slate-500">Τελευταίες εγγραφές</p>
            </div>
            <Link
              href="/supervisor/organizations"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
            >
              Όλοι
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {loading ? (
            <p className="mt-6 text-sm text-slate-400">Φόρτωση…</p>
          ) : recentOrgs.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {recentOrgs.map((org) => (
                <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-navy">{org.name}</p>
                    <p className="truncate text-xs text-slate-500">{org.adminEmail}</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-blue">
                      {org.plan}
                    </span>
                    <span className="text-xs tabular-nums text-slate-400">{formatDate(org.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Δεν υπάρχουν πελάτες ακόμα.</p>
          )}
        </Card>

        <div className="space-y-3">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Γρήγορες ενέργειες</p>
          {quickLinks.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-card border border-white/80 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue/20 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-blue" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
}
