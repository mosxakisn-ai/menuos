"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyZoneLabelOverrides,
  filterEnabledPassStationFilters,
  filterSpotsByZone,
  filterWaiterLocationsByZone,
  formatStaffStationsForLang,
  groupVenueSpotsByZone,
  mergeTableStateLabels,
  passStationInputToDb,
  stationDisplayLabel,
  zoneIdForWaiterLocation,
  type OrderPayload,
  type VenueSpotType,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  WaiterTableGrid,
  type MonitorViewTab,
  type PassStationFilter,
} from "@/components/dashboard/waiter-table-grid";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { alertNewWaiterCall } from "@/lib/waiter-alert";
import { cn } from "@/lib/utils";
import { SettingsSetupLinks } from "@/components/dashboard/settings-staff-panels";

type Venue = { id: string; name: string; slug?: string };
type VenueSpot = { id: string; type: VenueSpotType; label: string };
type PassSignal = {
  id: string;
  station: string;
  stationScreenLabel?: string | null;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  message: string | null;
  status: string;
  readyAt: string;
};
type WaiterCall = {
  id: string;
  type: string;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderPayload | null;
};

export function WaiterPanel({
  venues,
  initialVenueId,
  staffKey,
  staffViaCookie = false,
  staffMember,
}: {
  venues: Venue[];
  initialVenueId?: string;
  staffKey?: string;
  staffViaCookie?: boolean;
  staffMember?: { name: string; stations: string[] } | null;
}) {
  const { d, lang } = useDashboardCopy();
  const W = d.waiter;
  const resolvedInitial =
    initialVenueId && venues.some((v) => v.id === initialVenueId)
      ? initialVenueId
      : (venues[0]?.id ?? "");
  const [venueId, setVenueId] = useState(resolvedInitial);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [passSignals, setPassSignals] = useState<PassSignal[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);
  const [updatingPassId, setUpdatingPassId] = useState<string | null>(null);
  const [monitorTab, setMonitorTab] = useState<MonitorViewTab>("all");
  const [passStationFilter, setPassStationFilter] = useState<PassStationFilter>("all");
  const [zoneFilterId, setZoneFilterId] = useState<string>("all");
  const prevPendingRef = useRef<number | null>(null);
  const prevPassRef = useRef<number | null>(null);
  const prevCallsRef = useRef<WaiterCall[]>([]);
  const pendingBaselineSetRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const { config: opsConfig } = useVenueOperationsConfig(venueId);

  const load = useCallback(async () => {
    if (!venueId) return;
    const generation = ++loadGenerationRef.current;
    const params = new URLSearchParams({ venueId });
    if (staffKey && !staffViaCookie) params.set("staffKey", staffKey);
    const creds = staffViaCookie ? "include" : "same-origin";
    const [callsRes, passRes] = await Promise.all([
      fetch(`/api/waiter-call?${params}`, { credentials: creds }),
      fetch(`/api/pass-signals?${params}`, { credentials: creds }),
    ]);
    const data = await callsRes.json().catch(() => ({}));
    const passData = await passRes.json().catch(() => ({}));

    if (generation !== loadGenerationRef.current) return;

    if (callsRes.ok) {
      const newCalls = (data.calls ?? []) as WaiterCall[];
      if (pendingBaselineSetRef.current && prevCallsRef.current.length > 0) {
        const prevById = new Map(prevCallsRef.current.map((c) => [c.id, c]));
        const orderUpdated = newCalls.some((call) => {
          if (call.status !== "PENDING" || call.type !== "ORDER") return false;
          const prev = prevById.get(call.id);
          return prev != null && prev.updatedAt !== call.updatedAt;
        });
        if (orderUpdated) alertNewWaiterCall();
      }
      prevCallsRef.current = newCalls;
      setCalls(newCalls);
      setSpots((data.spots ?? []) as VenueSpot[]);
      const nextPending = data.pendingCount ?? 0;
      if (!pendingBaselineSetRef.current) {
        prevPendingRef.current = nextPending;
        pendingBaselineSetRef.current = true;
      }
      setPendingCount(nextPending);
    } else {
      setCalls([]);
      setSpots([]);
      prevCallsRef.current = [];
      if (!pendingBaselineSetRef.current) {
        prevPendingRef.current = 0;
        pendingBaselineSetRef.current = true;
      }
      setPendingCount(0);
      const apiError = typeof data.error === "string" ? data.error : null;
      if (callsRes.status === 401) {
        setFlash({ type: "error", text: W.sessionExpired });
      } else if (apiError) {
        setFlash({ type: "error", text: apiError });
      } else if (callsRes.status >= 500) {
        setFlash({ type: "error", text: W.loadFailed });
      }
    }

    if (passRes.ok) {
      const nextPass = (passData.activeCount ?? 0) as number;
      if (prevPassRef.current !== null && nextPass > prevPassRef.current) {
        alertNewWaiterCall();
      }
      if (prevPassRef.current === null) prevPassRef.current = nextPass;
      else prevPassRef.current = nextPass;
      setPassSignals((passData.signals ?? []) as PassSignal[]);
      setPassCount(nextPass);
    } else {
      setPassSignals([]);
      setPassCount(0);
      if (prevPassRef.current === null) prevPassRef.current = 0;
      if (passRes.status === 401 && callsRes.status !== 401) {
        setFlash({ type: "error", text: W.sessionExpired });
      }
    }
  }, [staffKey, staffViaCookie, venueId, W.sessionExpired, W.loadFailed, setFlash]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setCalls([]);
    setSpots([]);
    setPassSignals([]);
    setPendingCount(0);
    setPassCount(0);
    prevPendingRef.current = null;
    prevPassRef.current = null;
    prevCallsRef.current = [];
    pendingBaselineSetRef.current = false;
    setZoneFilterId("all");
    setPassStationFilter("all");
  }, [venueId]);

  useEffect(() => {
    if (!pendingBaselineSetRef.current || prevPendingRef.current === null) return;
    if (pendingCount > prevPendingRef.current) {
      alertNewWaiterCall();
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function updatePassStatus(signalId: string, status: "PICKED_UP" | "DELIVERED") {
    if (updatingPassId) return;
    setUpdatingPassId(signalId);
    try {
      const res = await fetch(`/api/pass-signals/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: staffViaCookie ? "include" : "same-origin",
        body: JSON.stringify({
          status,
          ...(staffKey && !staffViaCookie ? { staffKey } : {}),
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) await load();
    } finally {
      setUpdatingPassId(null);
    }
  }

  async function updateStatus(callId: string, status: "ACKNOWLEDGED" | "COMPLETED") {
    if (updatingCallId) return;
    setUpdatingCallId(callId);
    try {
      const res = await fetch(`/api/waiter-call/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: staffViaCookie ? "include" : "same-origin",
        body: JSON.stringify({
          status,
          ...(staffKey && !staffViaCookie ? { staffKey } : {}),
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) await load();
    } finally {
      setUpdatingCallId(null);
    }
  }

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const displaySpots = useMemo(
    () => filterSpotsByZone(spots, zoneFilterId, zoneGroups),
    [spots, zoneFilterId, zoneGroups],
  );

  const displayCalls = useMemo(
    () => filterWaiterLocationsByZone(calls, zoneFilterId, zoneGroups),
    [calls, zoneFilterId, zoneGroups],
  );

  const displayPassSignals = useMemo(() => {
    let rows = filterWaiterLocationsByZone(passSignals, zoneFilterId, zoneGroups);
    if (monitorTab !== "calls" && passStationFilter !== "all") {
      const dbStation = passStationInputToDb(passStationFilter);
      rows = rows.filter((pass) => pass.station === dbStation);
    }
    return rows;
  }, [passSignals, zoneFilterId, zoneGroups, monitorTab, passStationFilter]);

  const zoneActivityCounts = useMemo(() => {
    const counts = new Map<string, { pending: number; pass: number }>();
    const bump = (zoneId: string | null, kind: "pending" | "pass") => {
      if (!zoneId) return;
      const cur = counts.get(zoneId) ?? { pending: 0, pass: 0 };
      if (kind === "pending") cur.pending += 1;
      else cur.pass += 1;
      counts.set(zoneId, cur);
    };
    for (const call of calls) {
      if (call.status === "PENDING") {
        bump(zoneIdForWaiterLocation(call, zoneGroups), "pending");
      }
    }
    for (const pass of passSignals) {
      if (pass.status === "READY" || pass.status === "PICKED_UP") {
        bump(zoneIdForWaiterLocation(pass, zoneGroups), "pass");
      }
    }
    return counts;
  }, [calls, passSignals, zoneGroups]);

  function zoneActivityTotal(zoneId: string): { pending: number; pass: number; total: number } {
    if (zoneId === "all") {
      return { pending: pendingCount, pass: passCount, total: pendingCount + passCount };
    }
    const row = zoneActivityCounts.get(zoneId) ?? { pending: 0, pass: 0 };
    return { ...row, total: row.pending + row.pass };
  }

  const passStationFilters: { id: PassStationFilter; label: string }[] = useMemo(() => {
    const langCode = lang === "EN" ? "EN" : "GR";
    const all = [
      { id: "all" as const, label: W.passFilterAll },
      { id: "kitchen" as const, label: stationDisplayLabel(opsConfig ?? undefined, "kitchen", langCode) },
      { id: "bar" as const, label: stationDisplayLabel(opsConfig ?? undefined, "bar", langCode) },
      { id: "cold" as const, label: stationDisplayLabel(opsConfig ?? undefined, "cold", langCode) },
      { id: "dessert" as const, label: stationDisplayLabel(opsConfig ?? undefined, "dessert", langCode) },
    ];
    if (!opsConfig) return all;
    return filterEnabledPassStationFilters(all, opsConfig);
  }, [W.passFilterAll, opsConfig, lang]);

  useEffect(() => {
    if (passStationFilter === "all" || !opsConfig) return;
    if (!opsConfig.enabledStations.includes(passStationFilter)) {
      setPassStationFilter("all");
    }
  }, [opsConfig, passStationFilter]);

  const tableStateLabels = useMemo(
    () => mergeTableStateLabels(opsConfig ?? undefined, lang === "EN" ? "EN" : "GR"),
    [opsConfig, lang],
  );

  const passReadyLabels = useMemo(() => {
    const langCode = lang === "EN" ? "EN" : "GR";
    const prefix = langCode === "EN" ? "Ready — " : "Έτοιμο — ";
    return {
      kitchen: prefix + stationDisplayLabel(opsConfig ?? undefined, "kitchen", langCode),
      bar: prefix + stationDisplayLabel(opsConfig ?? undefined, "bar", langCode),
      cold: prefix + stationDisplayLabel(opsConfig ?? undefined, "cold", langCode),
      dessert: prefix + stationDisplayLabel(opsConfig ?? undefined, "dessert", langCode),
    };
  }, [opsConfig, lang]);

  if (venues.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{W.needVenueFirst}</p>
      </Card>
    );
  }

  const activeVenue = venues.find((v) => v.id === venueId);
  const isManagerView = !staffViaCookie && !staffKey;

  const monitorTabs: { id: MonitorViewTab; label: string }[] = [
    { id: "all", label: W.monitorTabAll },
    { id: "calls", label: W.monitorTabCalls },
    { id: "pass", label: W.monitorTabPass },
  ];

  const showStationFilters = monitorTab === "all" || monitorTab === "pass";
  const showZoneFilters = zoneGroups.length > 1;

  function renderZoneButton(zoneId: string, label: string) {
    const selected = zoneFilterId === zoneId;
    const activity = zoneActivityTotal(zoneId);
    return (
      <button
        key={zoneId}
        type="button"
        onClick={() => setZoneFilterId(zoneId)}
        className={cn(
          "flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-3 py-3 text-center transition sm:min-h-[4.25rem] sm:px-4",
          selected
            ? "border-brand-blue bg-brand-blue text-white shadow-md shadow-brand-blue/20"
            : activity.total > 0
              ? "border-amber-300 bg-amber-50 text-brand-navy hover:border-amber-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        )}
      >
        <span className={cn("text-base font-bold leading-tight sm:text-lg", selected && "text-white")}>
          {label}
        </span>
        {activity.total > 0 ? (
          <span
            className={cn(
              "text-2xl font-extrabold tabular-nums leading-none sm:text-3xl",
              selected ? "text-white" : "text-amber-700",
            )}
          >
            {activity.total}
          </span>
        ) : (
          <span className={cn("text-xs", selected ? "text-white/80" : "text-slate-400")}>—</span>
        )}
      </button>
    );
  }

  const hasActivity = displayCalls.length > 0 || displayPassSignals.length > 0;
  const isZoneFilteredEmpty =
    zoneFilterId !== "all" && displaySpots.length === 0 && !hasActivity && spots.length > 0;

  const venueStatusEnd = (
    <>
      {staffViaCookie || staffKey || venues.length === 1 ? (
        <p className="text-[11px] text-slate-700 sm:text-xs">
          <span className="font-medium text-brand-navy">{d.venue}: </span>
          {activeVenue?.name ?? "—"}
        </p>
      ) : (
        <label className="text-[11px] sm:text-xs">
          <span className="sr-only">{d.venue}</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="max-w-[9rem] rounded-button border border-slate-200 px-2 py-1 text-[11px] sm:max-w-none sm:px-2.5 sm:py-1.5 sm:text-xs"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {pendingCount > 0 || passCount > 0 ? (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:px-2.5 sm:text-xs">
          <Bell className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">
            {pendingCount > 0 ? W.pendingCount(pendingCount) : null}
            {pendingCount > 0 && passCount > 0 ? " · " : null}
            {passCount > 0 ? W.passCount(passCount) : null}
          </span>
        </span>
      ) : (
        <span className="text-[10px] text-slate-500 sm:text-xs">{W.refreshHint}</span>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {showZoneFilters ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3 sm:text-sm">
            {W.zonePickHeading}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {renderZoneButton("all", W.zoneFilterAll)}
            {zoneGroups.map((zone) => renderZoneButton(zone.id, zone.label))}
          </div>
        </section>
      ) : null}

      {isManagerView ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-600 sm:text-sm">{W.managerViewBadge}</p>
          <SettingsSetupLinks />
        </div>
      ) : staffMember ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm">
          {W.staffViewBadge(staffMember.name, formatStaffStationsForLang(staffMember.stations, lang))}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {monitorTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setMonitorTab(tab.id);
              if (tab.id === "calls") setPassStationFilter("all");
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 sm:text-sm",
              monitorTab === tab.id
                ? "bg-brand-navy text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showStationFilters ? (
        <div className="flex flex-wrap gap-1.5">
          {passStationFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setPassStationFilter(filter.id)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium transition sm:px-2.5 sm:py-1 sm:text-xs",
                passStationFilter === filter.id
                  ? "bg-orange-100 text-orange-900 ring-1 ring-orange-200"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {displaySpots.length === 0 && hasActivity ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {W.emptySpotsActiveHint}
        </p>
      ) : null}

      {displaySpots.length === 0 && !hasActivity ? (
        <Card className="border-dashed text-center">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 border-b border-slate-100 pb-4 text-right">
            {venueStatusEnd}
          </div>
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          {isZoneFilteredEmpty ? (
            <p className="mt-3 text-sm text-slate-500">{W.emptyZoneView}</p>
          ) : (
            <>
              <p className="mt-3 font-medium text-brand-navy">{W.emptyTitle}</p>
              <p className="mt-1 text-sm text-slate-500">{W.emptyDesc}</p>
            </>
          )}
        </Card>
      ) : (
        <WaiterTableGrid
          spots={displaySpots}
          calls={displayCalls}
          passSignals={displayPassSignals}
          viewTab={monitorTab}
          passStationFilter={passStationFilter}
          updatingCallId={updatingCallId}
          updatingPassId={updatingPassId}
          legendEnd={venueStatusEnd}
          stateLabels={tableStateLabels}
          passReadyLabels={passReadyLabels}
          onUpdateCall={(callId, status) => void updateStatus(callId, status)}
          onUpdatePass={(signalId, status) => void updatePassStatus(signalId, status)}
        />
      )}
    </div>
  );
}
