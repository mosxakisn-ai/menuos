"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Radio,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { cn } from "@/lib/utils";

const ACTIVE_WITHIN_SECONDS = 180;
const SURFACE_TABS = [
  { id: "", label: "Όλα" },
  { id: "marketing", label: "Site" },
  { id: "register", label: "Εγγραφή" },
  { id: "checkout", label: "Συνδρομή" },
] as const;

const SURFACE_LABELS: Record<string, string> = {
  marketing: "Site",
  register: "Εγγραφή",
  checkout: "Συνδρομή",
};

const STEP_LABELS: Record<string, string> = {
  browse: "Περιήγηση",
  pricing: "Τιμές",
  register_start: "Εγγραφή",
  register_otp: "OTP",
  checkout_opened: "Συνδρομή",
  pay_clicked: "Πάτησε πληρωμή",
  stripe_redirect: "Στο Stripe",
  payment_success: "Πλήρωσε ✓",
  payment_failed: "Απέτυχε",
  stripe_init_failed: "Σφάλμα checkout",
  heartbeat: "Περιήγηση",
};

type SessionRow = {
  sid: string;
  surface: string;
  step: string;
  path: string | null;
  plan_id: string | null;
  visitor_label: string | null;
  client_ip: string | null;
  ip_city: string | null;
  ip_country: string | null;
  status: string;
  step_seconds: number;
  stuck: boolean;
  duration_seconds: number;
  first_seen: number;
  last_seen: number;
  left_at: number | null;
  step_trail: Array<{ step: string; at: number }>;
};

function stepLabel(step: string) {
  return STEP_LABELS[step] ?? step;
}

function stepBadgeClass(step: string) {
  if (step === "payment_success") return "bg-emerald-100 text-emerald-900";
  if (step === "payment_failed" || step === "stripe_init_failed") return "bg-red-100 text-red-900";
  if (step === "pay_clicked" || step === "stripe_redirect") return "bg-amber-100 text-amber-900";
  if (step === "checkout_opened") return "bg-sky-100 text-sky-800";
  if (step === "register_start" || step === "register_otp") return "bg-violet-100 text-violet-900";
  return "bg-slate-100 text-slate-700";
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec} δευτ.`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m} λεπ. ${s} δευτ.` : `${m} λεπ.`;
}

function displayLocation(row: SessionRow) {
  if (row.ip_city && row.ip_country) return `${row.ip_city}, ${row.ip_country}`;
  if (row.ip_country) return row.ip_country;
  return "—";
}

function StepBadge({ step }: { step: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", stepBadgeClass(step))}>
      {stepLabel(step)}
    </span>
  );
}

function SessionCard({ row, compact }: { row: SessionRow; compact?: boolean }) {
  const online = row.status === "online";
  const label = row.visitor_label?.trim();
  const title = label || row.path?.trim() || SURFACE_LABELS[row.surface] || row.surface;
  const subtitle = label
    ? [SURFACE_LABELS[row.surface] ?? row.surface, row.path?.trim()].filter(Boolean).join(" · ")
    : null;
  return (
    <Card
      className={cn(
        "border p-3 shadow-sm",
        online ? "border-emerald-200/80 bg-emerald-50/30" : "border-slate-200 bg-white",
        compact && "p-2.5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-brand-navy">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {subtitle ?? (SURFACE_LABELS[row.surface] ?? row.surface)}
            {row.plan_id ? ` · ${row.plan_id}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600",
          )}
        >
          {online ? "Εδώ τώρα" : "Έφυγε"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StepBadge step={row.step} />
        {row.stuck ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            <AlertTriangle className="h-3 w-3" />
            Αναμονή
          </span>
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
        {row.client_ip ? (
          <p>
            <span className="font-medium text-slate-700">{row.client_ip}</span>
            {displayLocation(row) !== "—" ? ` · ${displayLocation(row)}` : ""}
          </p>
        ) : null}
        <p className="inline-flex items-center gap-1 text-slate-500">
          <Clock3 className="h-3 w-3" />
          {online
            ? `Στάδιο ${fmtDuration(row.step_seconds)}`
            : `Επίσκεψη ${fmtDuration(row.duration_seconds || row.step_seconds)}`}
        </p>
      </div>
    </Card>
  );
}

export function SupervisorOnlineClient() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [logEntries, setLogEntries] = useState<SessionRow[]>([]);
  const [paymentsToday, setPaymentsToday] = useState(0);
  const [stuckThreshold, setStuckThreshold] = useState(120);
  const [surfaceFilter, setSurfaceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        active_within: String(ACTIVE_WITHIN_SECONDS),
        exclude_test: "1",
        hot: "1",
        t: String(Date.now()),
      });
      const logParams = new URLSearchParams({
        hours: "24",
        limit: "200",
        exclude_test: "1",
        t: String(Date.now()),
      });
      if (surfaceFilter) {
        params.set("surface", surfaceFilter);
        logParams.set("surface", surfaceFilter);
      }
      const [liveRes, logRes] = await Promise.all([
        fetch(`/api/supervisor/visitor-intent/live?${params}`, { cache: "no-store", credentials: "include" }),
        fetch(`/api/supervisor/visitor-intent/log?${logParams}`, { cache: "no-store", credentials: "include" }),
      ]);
      const liveJson = await liveRes.json().catch(() => ({}));
      const logJson = await logRes.json().catch(() => ({}));
      if (!liveRes.ok) throw new Error(typeof liveJson.error === "string" ? liveJson.error : "Αποτυχία φόρτωσης");
      setSessions(Array.isArray(liveJson.sessions) ? liveJson.sessions : []);
      setPaymentsToday(typeof liveJson.payments_today === "number" ? liveJson.payments_today : 0);
      setStuckThreshold(liveJson.stuck_threshold_seconds ?? 120);
      setLastUpdated(liveJson.fetched_at ?? new Date().toISOString());
      if (logRes.ok && Array.isArray(logJson.entries)) {
        setLogEntries(logJson.entries);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Σφάλμα φόρτωσης");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [surfaceFilter]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(id);
  }, [load]);

  const scoped = useMemo(() => {
    if (!surfaceFilter) return sessions;
    return sessions.filter((row) => row.surface === surfaceFilter);
  }, [sessions, surfaceFilter]);

  const logScoped = useMemo(() => {
    const liveSids = new Set(scoped.map((r) => r.sid));
    const merged = [...logEntries];
    for (const row of scoped) {
      if (!merged.some((e) => e.sid === row.sid)) merged.unshift(row);
    }
    const filtered = surfaceFilter
      ? merged.filter((row) => row.surface === surfaceFilter)
      : merged;
    return filtered
      .filter((row) => row.status === "left" || !liveSids.has(row.sid))
      .slice(0, 40);
  }, [logEntries, scoped, surfaceFilter]);

  const stuckTotal = scoped.filter((r) => r.stuck).length;

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Πελάτες online τώρα"
        description="Ποιος είναι στο menuos.gr, στην εγγραφή ή στη συνδρομή — με IP, πόλη και ιστορικό 24 ωρών. Ανανέωση κάθε 3 δευτερόλεπτα."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
          Live
        </span>
        {!loading && scoped.length > 0 ? (
          <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-bold text-cyan-900">
            {scoped.length} εδώ τώρα
          </span>
        ) : null}
        {!loading && stuckTotal > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
            <AlertTriangle className="h-3 w-3" />
            {stuckTotal} σε αναμονή
          </span>
        ) : null}
        {!loading ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
            <CheckCircle2 className="h-3 w-3" />
            Σήμερα πληρωμές: {paymentsToday}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated ? (
            <span className="text-[11px] text-slate-400">Ενημέρωση: {fmtWhen(lastUpdated)}</span>
          ) : null}
          <button type="button" className={cn(buttonClass("secondary", "sm"), "inline-flex items-center gap-2")} disabled={refreshing} onClick={() => void load(true)}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Ανανέωση
          </button>
        </div>
      </div>

      <p className="mb-3 text-[11px] text-slate-500">
        IPv4 = διεύθυνση επισκέπτη · Πόλη/χώρα από geo · «Αναμονή» = ίδιο στάδιο &gt;{" "}
        {Math.round(stuckThreshold / 60)} λεπτά
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist">
        {SURFACE_TABS.map((tab) => (
          <button
            key={tab.id || "all"}
            type="button"
            role="tab"
            aria-selected={surfaceFilter === tab.id}
            onClick={() => setSurfaceFilter(tab.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              surfaceFilter === tab.id
                ? "bg-brand-blue text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section>
          {loading ? (
            <Card className="border-dashed p-8 text-center text-sm text-slate-500">Φόρτωση…</Card>
          ) : scoped.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <Radio className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-brand-navy">Κανένας πελάτης online τώρα</p>
              <p className="mt-1 text-sm text-slate-500">
                Όταν κάποιος ανοίξει το site, την εγγραφή ή τη συνδρομή, θα εμφανιστεί εδώ.
              </p>
            </Card>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {scoped.map((row) => (
                <SessionCard key={row.sid} row={row} />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ιστορικό 24ω</p>
          <ul className="mt-2 max-h-[70vh] space-y-2 overflow-y-auto">
            {logScoped.length === 0 ? (
              <li className="py-6 text-center text-xs text-slate-400">Κενό ιστορικό</li>
            ) : (
              logScoped.map((row) => (
                <li key={`log-${row.sid}-${row.last_seen}`}>
                  <SessionCard row={row} compact />
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </DashboardPage>
  );
}
