"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyZoneLabelOverrides,
  filterSpotsByZone,
  filterWaiterLocationsForZoneView,
  formatStaffAssignmentsForLang,
  listVenuePosts,
  groupVenueSpotsByZone,
  mergeTableStateLabels,
  zoneIdForWaiterLocation,
  resolveWaiterLocationInZones,
  type OrderPayload,
  type VenueSpotType,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { DashboardCountBadge } from "@/components/dashboard/dashboard-ui";
import { WaiterTableGrid } from "@/components/dashboard/waiter-table-grid";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { alertNewWaiterCall } from "@/lib/waiter-alert";
import { cn } from "@/lib/utils";

type Venue = { id: string; name: string; slug?: string };
type VenueSpot = { id: string; type: VenueSpotType; label: string };
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
type PassSignal = {
  id: string;
  station: string;
  status: string;
  stationScreenLabel?: string | null;
  tableNumber?: string | null;
  roomNumber?: string | null;
  sunbedNumber?: string | null;
  message?: string | null;
  readyAt?: string;
};

export function WaiterPanel({
  venues,
  initialVenueId,
  initialZoneId,
  staffKey,
  staffViaCookie = false,
  staffMember,
}: {
  venues: Venue[];
  initialVenueId?: string;
  initialZoneId?: string;
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
  const [passSignals, setPassSignals] = useState<PassSignal[]>([]);
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);
  const [updatingPassId, setUpdatingPassId] = useState<string | null>(null);
  const [zoneFilterId, setZoneFilterId] = useState<string>("all");
  const prevPendingRef = useRef<number | null>(null);
  const prevCallsRef = useRef<WaiterCall[]>([]);
  const prevPassIdsRef = useRef<Set<string>>(new Set());
  const pendingBaselineSetRef = useRef(false);
  const passBaselineSetRef = useRef(false);
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
      const newSignals = (passData.signals ?? []) as PassSignal[];
      if (passBaselineSetRef.current) {
        const hasNewPass = newSignals.some((signal) => !prevPassIdsRef.current.has(signal.id));
        if (hasNewPass) alertNewWaiterCall();
      }
      prevPassIdsRef.current = new Set(newSignals.map((signal) => signal.id));
      passBaselineSetRef.current = true;
      setPassSignals(newSignals);
    } else {
      setPassSignals([]);
      prevPassIdsRef.current = new Set();
      if (callsRes.ok && passRes.status >= 400) {
        const passError = typeof passData.error === "string" ? passData.error : null;
        if (passError) setFlash({ type: "error", text: passError });
      }
    }
  }, [staffKey, staffViaCookie, venueId, W.sessionExpired, W.loadFailed, setFlash]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setCalls([]);
    setPassSignals([]);
    setSpots([]);
    setPendingCount(0);
    prevPendingRef.current = null;
    prevCallsRef.current = [];
    prevPassIdsRef.current = new Set();
    pendingBaselineSetRef.current = false;
    passBaselineSetRef.current = false;
    setZoneFilterId("all");
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

  async function updateStatus(callId: string, status: "ACKNOWLEDGED" | "COMPLETED") {
    if (updatingCallId || updatingPassId) return;
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

  async function updatePassStatus(signalId: string, status: "PICKED_UP" | "DELIVERED") {
    if (updatingPassId || updatingCallId) return;
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

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const activeZoneGroups = useMemo(
    () => zoneGroups.filter((zone) => zone.spots.length > 0),
    [zoneGroups],
  );

  useEffect(() => {
    if (!initialZoneId || zoneGroups.length === 0) return;
    if (initialZoneId.trim() === "all") {
      setZoneFilterId("all");
      return;
    }
    if (zoneGroups.some((zone) => zone.id === initialZoneId)) {
      setZoneFilterId(initialZoneId);
    }
  }, [initialZoneId, zoneGroups]);

  /** Locked when staff has a zone or the share link/QR includes ?zone= (not manager panel). */
  const assignedZoneId = useMemo(() => {
    const raw = initialZoneId?.trim();
    if (!raw || raw === "all") return null;
    if (!staffMember && !staffViaCookie && !staffKey) return null;
    return zoneGroups.some((zone) => zone.id === raw) ? raw : null;
  }, [staffMember, staffViaCookie, staffKey, initialZoneId, zoneGroups]);

  useEffect(() => {
    if (initialZoneId?.trim() === "all") {
      setZoneFilterId("all");
      return;
    }
    if (assignedZoneId) setZoneFilterId(assignedZoneId);
  }, [assignedZoneId, initialZoneId]);

  const assignedZoneLabel = useMemo(
    () => zoneGroups.find((zone) => zone.id === assignedZoneId)?.label ?? null,
    [zoneGroups, assignedZoneId],
  );

  const displaySpots = useMemo(
    () => filterSpotsByZone(spots, zoneFilterId, zoneGroups),
    [spots, zoneFilterId, zoneGroups],
  );

  const displayCalls = useMemo(
    () => filterWaiterLocationsForZoneView(calls, zoneFilterId, zoneGroups),
    [calls, zoneFilterId, zoneGroups],
  );

  const displayPassSignals = useMemo(
    () => filterWaiterLocationsForZoneView(passSignals, zoneFilterId, zoneGroups),
    [passSignals, zoneFilterId, zoneGroups],
  );

  const readyPassSignals = useMemo(
    () => passSignals.filter((pass) => pass.status === "READY"),
    [passSignals],
  );

  const visibleActiveCount = useMemo(() => {
    const activeCalls = displayCalls.filter(
      (call) => call.status === "PENDING" || call.status === "ACKNOWLEDGED",
    ).length;
    const readyPasses = displayPassSignals.filter((pass) => pass.status === "READY").length;
    return activeCalls + readyPasses;
  }, [displayCalls, displayPassSignals]);

  const unmappedActiveCount = useMemo(() => {
    if (zoneGroups.length === 0) return 0;
    let count = 0;
    for (const call of calls) {
      if (call.status !== "PENDING" && call.status !== "ACKNOWLEDGED") continue;
      if (!resolveWaiterLocationInZones(call, zoneGroups)) count += 1;
    }
    for (const pass of passSignals) {
      if (pass.status !== "READY") continue;
      if (!resolveWaiterLocationInZones(pass, zoneGroups)) count += 1;
    }
    return count;
  }, [calls, passSignals, zoneGroups]);

  const zonePendingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const call of calls) {
      if (call.status !== "PENDING" && call.status !== "ACKNOWLEDGED") continue;
      const zoneId = zoneIdForWaiterLocation(call, zoneGroups);
      if (!zoneId) continue;
      counts.set(zoneId, (counts.get(zoneId) ?? 0) + 1);
    }
    for (const pass of passSignals) {
      if (pass.status !== "READY") continue;
      const zoneId = zoneIdForWaiterLocation(pass, zoneGroups);
      if (!zoneId) continue;
      counts.set(zoneId, (counts.get(zoneId) ?? 0) + 1);
    }
    return counts;
  }, [calls, passSignals, zoneGroups]);

  function zonePendingTotal(zoneId: string): number {
    if (zoneId === "all") {
      const activeCalls = calls.filter(
        (call) => call.status === "PENDING" || call.status === "ACKNOWLEDGED",
      ).length;
      const readyPasses = readyPassSignals.length;
      return activeCalls + readyPasses;
    }
    return zonePendingCounts.get(zoneId) ?? 0;
  }

  const tableStateLabels = useMemo(
    () => mergeTableStateLabels(opsConfig ?? undefined, lang === "EN" ? "EN" : "GR"),
    [opsConfig, lang],
  );

  if (venues.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{W.needVenueFirst}</p>
      </Card>
    );
  }

  const activeVenue = venues.find((v) => v.id === venueId);
  const isManagerView = !staffViaCookie && !staffKey;

  const showZoneFilters = activeZoneGroups.length > 1 && !assignedZoneId;

  function zoneSpotCount(zoneId: string): number {
    if (zoneId === "all") return spots.length;
    return activeZoneGroups.find((zone) => zone.id === zoneId)?.spots.length ?? 0;
  }

  function renderZoneButton(zoneId: string, label: string) {
    const selected = zoneFilterId === zoneId;
    const activePending = zonePendingTotal(zoneId);
    const spotCount = zoneSpotCount(zoneId);
    return (
      <button
        key={zoneId}
        type="button"
        onClick={() => setZoneFilterId(zoneId)}
        className={cn(
          "relative flex min-h-[4rem] w-[calc(50%-0.25rem)] max-w-[9.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 py-3 text-center transition sm:min-h-[4.25rem] sm:w-[calc(33.333%-0.5rem)] sm:px-4 lg:w-[calc(25%-0.5rem)]",
          selected
            ? "border-brand-blue bg-brand-blue text-white shadow-md shadow-brand-blue/20"
            : activePending > 0
              ? "border-amber-300 bg-amber-50 text-brand-navy hover:border-amber-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        )}
      >
        {activePending > 0 ? (
          <DashboardCountBadge
            count={activePending}
            className="absolute -right-1.5 -top-1.5 min-h-[1.35rem] min-w-[1.35rem] border-2 border-white text-[11px] shadow-md"
          />
        ) : null}
        <span className={cn("text-base font-bold leading-tight sm:text-lg", selected && "text-white")}>
          {label}
        </span>
        <span
          className={cn(
            "text-2xl font-extrabold tabular-nums leading-none sm:text-3xl",
            selected ? "text-white" : "text-brand-navy",
          )}
        >
          {spotCount}
        </span>
        <span className={cn("text-[10px] sm:text-xs", selected ? "text-white/85" : "text-slate-500")}>
          {W.zoneSpotCount(spotCount)}
        </span>
        {activePending > 0 ? (
          <span
            className={cn(
              "mt-0.5 text-[10px] font-semibold sm:text-xs",
              selected ? "text-amber-100" : "text-amber-700",
            )}
          >
            {W.zoneActiveCount(activePending)}
          </span>
        ) : null}
      </button>
    );
  }

  const hasActivity =
    displayCalls.some((call) => call.status === "PENDING" || call.status === "ACKNOWLEDGED") ||
    displayPassSignals.length > 0;
  const selectedZoneLabel =
    zoneFilterId === "all"
      ? null
      : (activeZoneGroups.find((zone) => zone.id === zoneFilterId)?.label ?? null);
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
      {visibleActiveCount > 0 ? (
        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:px-2.5 sm:text-xs">
          <Bell className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">{W.activeCount(visibleActiveCount)}</span>
        </span>
      ) : (
        <span className="text-[10px] text-slate-500 sm:text-xs">{W.refreshHint}</span>
      )}
    </>
  );

  return (
    <div className="space-y-2 sm:space-y-4">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {assignedZoneId && assignedZoneLabel ? (
        staffViaCookie ? (
          <p className="text-sm font-semibold text-brand-navy">
            {assignedZoneLabel}
            <span className="font-normal text-slate-500">
              {" "}
              · {W.zoneSpotCount(zoneSpotCount(assignedZoneId))}
            </span>
          </p>
        ) : (
          <section className="rounded-2xl border border-brand-blue/25 bg-gradient-to-br from-brand-blue/[0.06] to-cyan-400/[0.08] px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue/80">
              {W.assignedZoneHeading}
            </p>
            <p className="mt-1 text-lg font-bold text-brand-navy">{assignedZoneLabel}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {W.zoneSpotCount(zoneSpotCount(assignedZoneId))}
            </p>
            {W.assignedZoneHint ? (
              <p className="mt-1 text-xs text-slate-600">{W.assignedZoneHint}</p>
            ) : null}
          </section>
        )
      ) : showZoneFilters ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3 sm:text-sm">
            {W.zonePickHeading}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {renderZoneButton("all", W.zoneFilterAll)}
            {activeZoneGroups.map((zone) => renderZoneButton(zone.id, zone.label))}
          </div>
          {unmappedActiveCount > 0 ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm">
              {W.unmappedActiveHint(unmappedActiveCount)}
            </p>
          ) : null}
        </section>
      ) : null}

      {isManagerView ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm">
          {selectedZoneLabel ? W.managerZoneViewBadge(selectedZoneLabel) : W.managerViewBadge}
        </p>
      ) : staffMember && !(staffViaCookie && assignedZoneId) ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-sm">
          {W.staffViewBadge(
            staffMember.name,
            assignedZoneLabel,
            formatStaffAssignmentsForLang(
              staffMember.stations,
              lang === "EN" ? "EN" : "GR",
              listVenuePosts(opsConfig ?? undefined, lang === "EN" ? "EN" : "GR"),
            ),
          )}
        </p>
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
          updatingCallId={updatingCallId}
          updatingPassId={updatingPassId}
          legendEnd={venueStatusEnd}
          stateLabels={tableStateLabels}
          onUpdateCall={(callId, status) => void updateStatus(callId, status)}
          onUpdatePass={(signalId, status) => void updatePassStatus(signalId, status)}
        />
      )}
    </div>
  );
}
