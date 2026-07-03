"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  LifeBuoy,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import type {
  HelpDeskCustomerRow,
  HelpDeskReportRow,
} from "@/lib/client-diagnostics-service";
import { cn } from "@/lib/utils";

type Summary = {
  openCount: number;
  last24h: number;
  affectedCustomers: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  pdf_import: "PDF import",
  catalog: "Κατάλογος",
  billing: "Συνδρομή",
  qr: "QR",
  waiter: "Σερβιτόρος",
  push: "Push ειδοποιήσεις",
  pass_flow: "Ροή πάσου (κουζίνα/bar)",
  waiter_flow: "Ροή κλήσεων",
  settings: "Ρυθμίσεις",
  dashboard: "Panel",
  auth: "Σύνδεση",
  subscription: "Συνδρομή",
  api: "API",
  client: "Browser",
  unknown: "Άλλο",
};

const SOURCE_LABELS: Record<string, string> = {
  client_api: "API (browser)",
  client_nav: "Πλοήγηση",
  server: "Server",
  client: "Browser",
};

const SEVERITY_LABELS: Record<string, string> = {
  ERROR: "Σφάλμα",
  WARN: "Προειδοποίηση",
  INFO: "Πληροφορία",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Ανοιχτό",
  ACKNOWLEDGED: "Σε εξέλιξη",
  RESOLVED: "Κλειστό",
};

const ERROR_CODE_LABELS: Record<string, { title: string; hint: string }> = {
  nav_loop: {
    title: "Loop πλοήγησης καταλόγου",
    hint: "Το URL άλλαξε πολλές φορές σε λίγα δευτερόλεπτα — σταμάτησε αυτόματα για ασφάλεια.",
  },
  ocr_failed: {
    title: "Αποτυχία OCR",
    hint: "Δεν διαβάστηκε σωστά το PDF (OCR).",
  },
  pdf_extract_failed: {
    title: "Αποτυχία εξαγωγής PDF",
    hint: "Δεν εξήχθη κείμενο από το αρχείο.",
  },
  parse_failed: {
    title: "Αποτυχία ανάλυσης menu",
    hint: "Το κείμενο του PDF δεν έγινε προσχέδιο πιάτων.",
  },
  translate_failed: {
    title: "Αποτυχία μετάφρασης",
    hint: "Η αυτόματη μετάφραση δεν ολοκληρώθηκε.",
  },
  catalog_venue_not_found: {
    title: "Κατάστημα δεν βρέθηκε",
    hint: "Το API καταλόγου δεν βρήκε το κατάστημα.",
  },
  push_disabled: {
    title: "Push απενεργοποιημένο",
    hint: "Δεν υπάρχουν VAPID keys στο server — κανένα push δεν στάλθηκε.",
  },
  push_no_subscribers: {
    title: "Χωρίς εγγραφές push",
    hint: "Κανένας σερβιτόρος δεν έχει ενεργοποιήσει ειδοποιήσεις στο κινητό.",
  },
  push_no_targets: {
    title: "Κανένας κατάλληλος σερβιτόρος",
    hint: "Υπάρχουν εγγραφές push αλλά κανείς δεν καλύπτει αυτό το τμήμα/ζώνη.",
  },
  push_all_failed: {
    title: "Αποτυχία push σε όλους",
    hint: "Το μήνυμα δημιουργήθηκε αλλά κανένα push δεν παραδόθηκε — ρίσκο χαμένου μηνύματος.",
  },
  push_partial_failed: {
    title: "Μερική αποτυχία push",
    hint: "Μερικοί σερβιτόροι δεν έλαβαν push — έλεγξε ποιοι έχουν ενεργές ειδοποιήσεις.",
  },
  push_sent: {
    title: "Push παραδόθηκε",
    hint: "Επιτυχής αποστολή push — audit trail (κλειστό).",
  },
  push_dispatch_error: {
    title: "Σφάλμα αποστολής push",
    hint: "Το server απέτυχε πριν ολοκληρωθεί η αποστολή — έλεγξε logs.",
  },
  pass_created: {
    title: "Νέο πάσο από κουζίνα/bar",
    hint: "Η οθόνη τμήματος έστειλε ειδοποίηση σερβιτόρου — audit trail.",
  },
  pass_picked_up: {
    title: "Σερβιτόρος πήρε πάσο",
    hint: "Ο σερβιτόρος επιβεβαίωσε ότι πήγε — audit trail.",
  },
  pass_delivered: {
    title: "Πάσο παραδόθηκε",
    hint: "Ο σερβιτόρος σήμανε παράδοση στο τραπέζι — audit trail.",
  },
  pass_canceled: {
    title: "Ακύρωση πάσου",
    hint: "Η κουζίνα/bar ακύρωσε πριν το πάρει ο σερβιτόρος.",
  },
  pass_slow_pickup: {
    title: "Αργή απάντηση σε πάσο",
    hint: "Πέρασαν >2 λεπτά από το πάσο μέχρι να το πάρει ο σερβιτόρος.",
  },
  guest_call_created: {
    title: "Νέα κλήση από πελάτη",
    hint: "Ο επισκέπτης κάλεσε σερβιτόρο/λογαριασμό — audit trail.",
  },
  waiter_call_ack: {
    title: "Σερβιτόρος απάντησε σε κλήση",
    hint: "Ο σερβιτόρος σήμανε «πήγαινε εκεί» — audit trail.",
  },
  waiter_call_done: {
    title: "Κλήση ολοκληρώθηκε",
    hint: "Ο σερβιτόρος σήμανε ολοκλήρωση — audit trail.",
  },
  waiter_call_slow_ack: {
    title: "Αργή απάντηση σε κλήση",
    hint: "Πέρασαν >3 λεπτά από την κλήση μέχρι να απαντήσει ο σερβιτόρος.",
  },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("el-GR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityClass(severity: string) {
  if (severity === "ERROR") return "bg-red-100 text-red-800 ring-red-200";
  if (severity === "WARN") return "bg-amber-100 text-amber-900 ring-amber-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function severityIconClass(severity: string) {
  if (severity === "ERROR") return "text-red-600";
  if (severity === "INFO") return "text-brand-blue";
  return "text-amber-600";
}

function statusClass(status: string) {
  if (status === "OPEN") return "bg-red-50 text-red-700 ring-red-200";
  if (status === "ACKNOWLEDGED") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-emerald-50 text-emerald-800 ring-emerald-200";
}

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className={cn("border-white/80 p-4 shadow-card", accent)}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{value}</p>
    </Card>
  );
}

function CopyCodeBlock({
  label,
  text,
  variant = "light",
}: {
  label: string;
  text: string;
  variant?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={dashboardLabelClass}>{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            buttonClass("secondary", "sm"),
            "inline-flex items-center gap-1.5 px-2 py-1 text-[11px]",
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Αντιγράφηκε" : "Αντιγραφή"}
        </button>
      </div>
      <pre
        className={cn(
          "max-h-40 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed",
          variant === "dark"
            ? "bg-slate-900 text-slate-100"
            : "border border-slate-200 bg-white text-slate-700",
        )}
      >
        {text}
      </pre>
    </div>
  );
}

function ContextSummary({ context }: { context: Record<string, unknown> }) {
  const rows: { label: string; value: string }[] = [];
  if (typeof context.url === "string") rows.push({ label: "URL", value: context.url });
  if (typeof context.mode === "string") {
    rows.push({
      label: "Λειτουργία",
      value: context.mode === "import" ? "Εισαγωγή PDF" : "Κατάλογος",
    });
  }
  if (typeof context.role === "string") rows.push({ label: "Ρόλος", value: context.role });
  if (typeof context.venueId === "string") rows.push({ label: "Venue ID", value: context.venueId });
  if (typeof context.menuId === "string") rows.push({ label: "Menu ID", value: context.menuId });
  if (typeof context.replacesInWindow === "number") {
    rows.push({ label: "Αλλαγές URL (3 δευτ.)", value: String(context.replacesInWindow) });
  }
  if (typeof context.location === "string") rows.push({ label: "Θέση", value: context.location });
  if (typeof context.staffMemberName === "string") {
    rows.push({ label: "Σερβιτόρος", value: context.staffMemberName });
  }
  if (typeof context.waitSeconds === "number") {
    rows.push({ label: "Χρόνος αναμονής", value: `${context.waitSeconds}s` });
  }
  if (typeof context.signalId === "string") rows.push({ label: "Pass signal ID", value: context.signalId });
  if (typeof context.callId === "string") rows.push({ label: "Κλήση ID", value: context.callId });
  if (typeof context.station === "string") rows.push({ label: "Τμήμα", value: context.station });
  if (context.push && typeof context.push === "object" && !Array.isArray(context.push)) {
    const push = context.push as Record<string, unknown>;
    if (typeof push.sent === "number" && typeof push.targetCount === "number") {
      rows.push({ label: "Push", value: `${push.sent}/${push.targetCount} OK` });
    }
    if (typeof push.staleRemoved === "number" && push.staleRemoved > 0) {
      rows.push({ label: "Ληγμένες εγγραφές", value: String(push.staleRemoved) });
    }
  }

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="font-semibold text-slate-500">{row.label}</dt>
          <dd className="mt-0.5 break-all font-mono text-slate-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function errorCodeMeta(code: string | null | undefined) {
  if (!code) return null;
  return ERROR_CODE_LABELS[code] ?? null;
}

export function SupervisorHelpDeskClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [customers, setCustomers] = useState<HelpDeskCustomerRow[]>([]);
  const [reports, setReports] = useState<HelpDeskReportRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<HelpDeskCustomerRow | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [showClosedReports, setShowClosedReports] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ status });
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await fetch(`/api/supervisor/help-desk?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { summary: Summary; customers: HelpDeskCustomerRow[] };
      setSummary(data.summary);
      setCustomers(data.customers);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  const loadReports = useCallback(async (orgId: string | null) => {
    if (!orgId && orgId !== null) return;
    setLoadingReports(true);
    try {
      const params = new URLSearchParams({
        organizationId: orgId ?? "unknown",
        status: "ALL",
      });
      const res = await fetch(`/api/supervisor/help-desk?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { reports: HelpDeskReportRow[] };
      setReports(data.reports);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!selectedCustomer) return;
    const stillVisible = customers.some((c) => c.organizationId === selectedOrgId);
    if (!stillVisible) {
      setSelectedCustomer(null);
      setSelectedOrgId(null);
      setReports([]);
      setExpandedId(null);
    }
  }, [customers, selectedCustomer, selectedOrgId]);

  function selectCustomer(row: HelpDeskCustomerRow) {
    setSelectedOrgId(row.organizationId);
    setSelectedCustomer(row);
    setExpandedId(null);
    setShowClosedReports(false);
    setActionError(null);
    void loadReports(row.organizationId);
  }

  async function patchReport(id: string, patch: { status?: string; internalNote?: string | null }) {
    setActionError(null);
    const res = await fetch(`/api/supervisor/help-desk/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setActionError("Η ενημέρωση απέτυχε. Δοκίμασε ξανά.");
      return;
    }
    if (patch.status === "RESOLVED") {
      setExpandedId(null);
    }
    await loadReports(selectedOrgId);
    await loadCustomers();
  }

  const includeClosedReports =
    showClosedReports || status === "RESOLVED" || status === "ALL";
  const visibleReports = includeClosedReports
    ? reports
    : reports.filter((r) => r.status !== "RESOLVED");

  return (
    <DashboardPage wide>
      <DashboardPageHeader title="Help Desk" />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Ανοιχτά" value={summary?.openCount ?? 0} accent="border-red-100/80" />
        <Kpi label="Τελευταίες 24 ώρες" value={summary?.last24h ?? 0} accent="border-amber-100/80" />
        <Kpi
          label="Πελάτες με θέμα"
          value={summary?.affectedCustomers ?? 0}
          accent="border-brand-blue/15"
        />
      </div>

      <Card className="grid gap-4 border-brand-blue/10 p-4 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-2">
          <span className={dashboardLabelClass}>Αναζήτηση</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={cn(dashboardFieldClass, "pl-9")}
              placeholder="Επιχείρηση, email, μήνυμα σφάλματος…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className={dashboardLabelClass}>Κατάσταση</span>
          <select className={dashboardFieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Ενεργά (ανοιχτά + σε εξέλιξη)</option>
            <option value="OPEN">Μόνο ανοιχτά</option>
            <option value="ACKNOWLEDGED">Σε εξέλιξη</option>
            <option value="RESOLVED">Κλειστά</option>
            <option value="ALL">Όλα</option>
          </select>
        </label>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void loadCustomers()}
          className={cn(buttonClass("secondary", "sm"), "inline-flex items-center gap-2")}
        >
          <RefreshCw className="h-4 w-4" />
          Ανανέωση
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600">Αποτυχία φόρτωσης.</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">Φόρτωση…</p>
      ) : customers.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed border-emerald-200 bg-emerald-50/40 p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="font-semibold text-brand-navy">Καμία ενεργή αναφορά</p>
          <p className="max-w-md text-sm text-slate-600">
            Όταν κάποιος πελάτης έχει σφάλμα στο panel, θα εμφανίζεται εδώ αυτόματα.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 bg-brand-surface px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Πελάτες</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {customers.map((row) => {
                const active =
                  selectedOrgId === row.organizationId ||
                  (selectedOrgId === null && row.organizationId === null);
                return (
                  <li key={row.organizationId ?? "unknown"}>
                    <button
                      type="button"
                      onClick={() => selectCustomer(row)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-blue/[0.03]",
                        active && "bg-brand-blue/[0.06] ring-1 ring-inset ring-brand-blue/15",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand-navy">{row.organizationName}</p>
                          {row.openCount > 0 ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {row.openCount} ανοιχτά
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{row.adminEmail ?? "—"}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">{row.latestMessage}</p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {CATEGORY_LABELS[row.latestCategory] ?? row.latestCategory} ·{" "}
                          {formatWhen(row.latestAt)}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-card border border-slate-200 bg-white shadow-card">
            {!selectedCustomer ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center text-slate-500">
                <LifeBuoy className="h-10 w-10 text-brand-blue/40" />
                <p className="text-sm">Επίλεξε πελάτη για λεπτομέρειες σφαλμάτων.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Αναφορές</p>
                  <h3 className="mt-1 font-serif text-lg font-bold text-brand-navy">
                    {selectedCustomer.organizationName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedCustomer.adminEmail ?? "—"}
                    {selectedCustomer.plan ? ` · ${selectedCustomer.plan}` : ""}
                    {selectedCustomer.subscriptionStatus
                      ? ` · ${selectedCustomer.subscriptionStatus}`
                      : ""}
                  </p>
                  <p className="mt-3 rounded-lg bg-brand-blue/[0.04] px-3 py-2 text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-brand-navy">Ροή:</span>{" "}
                    <span className="text-red-700">Ανοιχτό</span> →{" "}
                    <span className="text-amber-800">Σε εξέλιξη</span> (το κοιτάς) →{" "}
                    <span className="text-emerald-800">Κλείσιμο</span> (βγαίνει από τα ενεργά)
                    <br />
                    <span className="font-semibold text-brand-navy">Push / πάσος / κλήσεις:</span>{" "}
                    Το ιστορικό (ποιος έστειλε, αν πήγε push, ποιος απάντησε) είναι στις{" "}
                    <span className="font-medium">κλειστές</span> αναφορές — ενεργοποίησε «Εμφάνιση
                    κλειστών» παρακάτω.
                  </p>
                  {status !== "RESOLVED" && status !== "ALL" ? (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={showClosedReports}
                        onChange={(e) => setShowClosedReports(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      Εμφάνιση κλειστών αναφορών
                    </label>
                  ) : null}
                  {actionError ? (
                    <p className="mt-2 text-xs text-red-600">{actionError}</p>
                  ) : null}
                </div>
                {loadingReports ? (
                  <p className="p-5 text-sm text-slate-500">Φόρτωση αναφορών…</p>
                ) : visibleReports.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">
                    {reports.some((r) => r.status === "RESOLVED") && !includeClosedReports
                      ? "Όλες οι αναφορές είναι κλειστές. Ενεργοποίησε «Εμφάνιση κλειστών» για ιστορικό."
                      : "Δεν βρέθηκαν αναφορές."}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {visibleReports.map((report) => {
                      const open = expandedId === report.id;
                      const codeMeta = errorCodeMeta(report.errorCode);
                      const contextObj =
                        report.context && typeof report.context === "object" && !Array.isArray(report.context)
                          ? (report.context as Record<string, unknown>)
                          : null;
                      const contextJson = report.context
                        ? JSON.stringify(report.context, null, 2)
                        : null;
                      return (
                        <li key={report.id} className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setExpandedId(open ? null : report.id)}
                            className="flex w-full items-start gap-3 text-left"
                          >
                            <AlertTriangle
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0",
                                severityIconClass(report.severity),
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                                    severityClass(report.severity),
                                  )}
                                >
                                  {SEVERITY_LABELS[report.severity] ?? report.severity}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                                    statusClass(report.status),
                                  )}
                                >
                                  {STATUS_LABELS[report.status] ?? report.status}
                                </span>
                                <span className="text-[10px] font-semibold uppercase text-slate-400">
                                  {CATEGORY_LABELS[report.category] ?? report.category}
                                </span>
                                {report.occurrenceCount > 1 ? (
                                  <span className="text-[10px] text-slate-500">×{report.occurrenceCount}</span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm font-medium text-brand-navy">{report.message}</p>
                              {report.errorCode ? (
                                <div className="mt-1">
                                  <p className="text-xs font-semibold text-slate-700">
                                    {codeMeta?.title ?? report.errorCode}
                                  </p>
                                  {codeMeta ? (
                                    <p className="mt-0.5 text-xs text-slate-500">{codeMeta.hint}</p>
                                  ) : null}
                                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                    {report.errorCode}
                                  </p>
                                </div>
                              ) : null}
                              <p className="mt-1 text-xs text-slate-400">
                                {formatWhen(report.lastSeenAt)} ·{" "}
                                {SOURCE_LABELS[report.source] ?? report.source}
                                {report.userEmail ? ` · ${report.userEmail}` : ""}
                              </p>
                            </div>
                          </button>

                          {open ? (
                            <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                              {report.status === "RESOLVED" ? (
                                <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                                  Κλειστή αναφορά — δεν εμφανίζεται στα ενεργά. «Ξανά άνοιγμα» αν χρειαστεί.
                                </p>
                              ) : null}
                              {contextObj ? <ContextSummary context={contextObj} /> : null}
                              {report.stack ? (
                                <CopyCodeBlock
                                  label="Stack trace (script error)"
                                  text={report.stack}
                                  variant="dark"
                                />
                              ) : null}
                              {contextJson ? (
                                <CopyCodeBlock
                                  label="Τεχνικά στοιχεία (JSON)"
                                  text={contextJson}
                                />
                              ) : null}
                              <label className="block text-xs">
                                <span className={dashboardLabelClass}>Σημείωση ops</span>
                                <textarea
                                  className={cn(dashboardFieldClass, "mt-1 min-h-[4rem] font-normal")}
                                  value={noteDraft[report.id] ?? report.internalNote ?? ""}
                                  onChange={(e) =>
                                    setNoteDraft((prev) => ({ ...prev, [report.id]: e.target.value }))
                                  }
                                  placeholder="Εσωτερική σημείωση ops…"
                                />
                              </label>
                              <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3">
                                {report.status !== "ACKNOWLEDGED" && report.status !== "RESOLVED" ? (
                                  <button
                                    type="button"
                                    className={buttonClass("secondary", "sm")}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "ACKNOWLEDGED",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    Σε εξέλιξη
                                  </button>
                                ) : null}
                                {report.status !== "RESOLVED" ? (
                                  <button
                                    type="button"
                                    className={cn(
                                      buttonClass("primary", "sm"),
                                      "inline-flex items-center gap-1.5",
                                    )}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "RESOLVED",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Κλείσιμο
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className={buttonClass("secondary", "sm")}
                                    onClick={() =>
                                      void patchReport(report.id, {
                                        status: "OPEN",
                                        internalNote: noteDraft[report.id] ?? report.internalNote,
                                      })
                                    }
                                  >
                                    Ξανά άνοιγμα
                                  </button>
                                )}
                                {report.status !== "RESOLVED" ? (
                                  <span className="text-[11px] text-slate-500">
                                    «Κλείσιμο» = τέλος, βγαίνει από ενεργά
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
