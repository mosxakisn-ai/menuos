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
  zoneIdForWaiterLocationView,
  mergeTableStateLabels,
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
import { speakGreekLine, speakPassMessage, unlockWaiterAudio } from "@/lib/waiter-voice";
import type { OrganizationNotificationSettings } from "@menuos/shared";
import { DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS } from "@menuos/shared";
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
  zoneId?: string | null;
  message?: string | null;
  readyAt?: string;
};

function isMonitorPendingCall(call: WaiterCall): boolean {
  return call.status === "PENDING";
}

function isMonitorPendingPass(pass: PassSignal): boolean {
  return pass.status === "READY";
}

function StaffNameChip({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[45%] min-w-0 shrink-0 items-center overflow-hidden rounded-full border border-brand-blue/25 bg-gradient-to-r from-brand-blue/[0.07] to-cyan-400/[0.12] px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-brand-navy shadow-[0_1px_8px_rgba(37,99,235,0.12)] sm:max-w-[50%] sm:px-3 sm:text-xs">
      <span className="truncate">{name}</span>
    </span>
  );
}

export function WaiterPanel({
  venues,
  initialVenueId,
  initialZoneId,
  staffKey,
  staffViaCookie = false,
  staffMember,
  notificationSettings = DEFAULT_ORGANIZATION_NOTIFICATION_SETTINGS,
}: {
  venues: Venue[];
  initialVenueId?: string;
  initialZoneId?: string;
  staffKey?: string;
  staffViaCookie?: boolean;
  staffMember?: { name: string; stations: string[] } | null;
  notificationSettings?: OrganizationNotificationSettings;
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
  const [pendingByVenue, setPendingByVenue] = useState<Record<string, number>>({});
  const prevPendingRef = useRef<number | null>(null);
  const prevCallsRef = useRef<WaiterCall[]>([]);
  const prevPassIdsRef = useRef<Set<string>>(new Set());
  const pendingBaselineSetRef = useRef(false);
  const passBaselineSetRef = useRef(false);
  const autoZoneAppliedRef = useRef(false);
  const zoneFilterUserPickedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const zoneFilterIdRef = useRef(zoneFilterId);
  const assignedZoneIdRef = useRef<string | null>(null);
  const spotsRef = useRef<VenueSpot[]>([]);
  const opsConfigRef = useRef<ReturnType<typeof useVenueOperationsConfig>["config"]>(undefined);
  const notificationSettingsRef = useRef(notificationSettings);
  const lastPassAlertIdRef = useRef<string | null>(null);
  const lastWaiterCallAlertIdRef = useRef<string | null>(null);
  zoneFilterIdRef.current = zoneFilterId;
  notificationSettingsRef.current = notificationSettings;
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const { config: opsConfig } = useVenueOperationsConfig(venueId);
  opsConfigRef.current = opsConfig;

  useEffect(() => {
    const unlock = () => unlockWaiterAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  function triggerPassAlert(
    pass: PassSignal,
    announcementGroups: ReturnType<typeof groupVenueSpotsByZone>,
  ) {
    if (lastPassAlertIdRef.current === pass.id) return;
    lastPassAlertIdRef.current = pass.id;
    alertNewWaiterCall();
    if (!notificationSettingsRef.current.voiceMessagesEnabled) return;
    const passZoneId =
      pass.zoneId?.trim() || zoneIdForWaiterLocationView(pass, announcementGroups);
    speakPassMessage({
      tableNumber: pass.tableNumber ?? undefined,
      roomNumber: pass.roomNumber ?? undefined,
      sunbedNumber: pass.sunbedNumber ?? undefined,
      zoneGroups: announcementGroups,
      activeZoneId: passZoneId,
    });
  }

  function passAlertAllowedForZone(signalZoneId: string | null | undefined): boolean {
    const alertZoneId =
      assignedZoneIdRef.current ||
      (zoneFilterIdRef.current !== "all" ? zoneFilterIdRef.current : null);
    if (!alertZoneId) return true;
    if (!signalZoneId?.trim()) return true;
    return signalZoneId.trim() === alertZoneId;
  }

  useEffect(() => {
    function onServiceWorkerMessage(event: MessageEvent) {
      const data = event.data as {
        type?: string;
        announcement?: string;
        voiceEnabled?: boolean;
        passId?: string;
        zoneId?: string;
        callId?: string;
      } | null;
      if (document.visibilityState !== "visible") return;

      if (data?.type === "MENUOS_WAITER_CALL_ALERT") {
        if (!data.callId || lastWaiterCallAlertIdRef.current === data.callId) return;
        lastWaiterCallAlertIdRef.current = data.callId;
        alertNewWaiterCall();
        return;
      }

      if (data?.type !== "MENUOS_PASS_ALERT") return;
      if (!data.passId) return;
      if (!passAlertAllowedForZone(data.zoneId)) return;
      if (lastPassAlertIdRef.current === data.passId) return;
      lastPassAlertIdRef.current = data.passId;
      alertNewWaiterCall();
      if (!data.voiceEnabled) return;
      const text = data.announcement?.trim();
      if (!text || !notificationSettingsRef.current.voiceMessagesEnabled) return;
      speakGreekLine(text);
    }
    navigator.serviceWorker?.addEventListener("message", onServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onServiceWorkerMessage);
    };
  }, []);

  const load = useCallback(async () => {
    if (!venueId) return;
    const generation = ++loadGenerationRef.current;
    const params = new URLSearchParams({ venueId });
    if (staffKey && !staffViaCookie) params.set("staffKey", staffKey);
    const creds = staffViaCookie ? "include" : "same-origin";
    const managerView = !staffKey && !staffViaCookie;
    const [callsRes, passRes, orgPendingRes] = await Promise.all([
      fetch(`/api/waiter-call?${params}`, { credentials: creds }),
      fetch(`/api/pass-signals?${params}`, { credentials: creds }),
      managerView
        ? fetch("/api/dashboard/pending-calls", { credentials: "same-origin", cache: "no-store" })
        : Promise.resolve(null),
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
        if (orderUpdated && document.visibilityState === "visible") alertNewWaiterCall();
      }
      prevCallsRef.current = newCalls;
      setCalls(newCalls);
      setSpots((data.spots ?? []) as VenueSpot[]);
      spotsRef.current = (data.spots ?? []) as VenueSpot[];
      const nextPending = data.pendingCount ?? 0;
      if (!pendingBaselineSetRef.current) {
        prevPendingRef.current = nextPending;
        pendingBaselineSetRef.current = true;
      }
      setPendingCount(nextPending);
    } else {
      setCalls([]);
      setSpots([]);
      spotsRef.current = [];
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
      if (typeof passData.voiceMessagesEnabled === "boolean") {
        notificationSettingsRef.current = {
          ...notificationSettingsRef.current,
          voiceMessagesEnabled: passData.voiceMessagesEnabled,
        };
      }
      if (passBaselineSetRef.current) {
        const freshPasses = newSignals.filter(
          (signal) => !prevPassIdsRef.current.has(signal.id) && isMonitorPendingPass(signal),
        );
        const loadedSpots = callsRes.ok
          ? ((data.spots ?? []) as VenueSpot[])
          : spotsRef.current;
        const spotInputs = loadedSpots.map((spot) => ({
          type: spot.type,
          label: spot.label,
        }));
        const announcementGroups = applyZoneLabelOverrides(
          groupVenueSpotsByZone(spotInputs),
          opsConfigRef.current?.zoneLabels,
        );
        const alertZoneId =
          assignedZoneIdRef.current ||
          (zoneFilterIdRef.current !== "all" ? zoneFilterIdRef.current : null);
        const alertablePasses = alertZoneId
          ? freshPasses.filter((signal) => {
              const signalZone =
                signal.zoneId?.trim() ||
                zoneIdForWaiterLocationView(signal, announcementGroups);
              return signalZone === alertZoneId;
            })
          : freshPasses;
        const hasNewPass = alertablePasses.length > 0;
        if (hasNewPass && document.visibilityState === "visible") {
          const latest = [...alertablePasses].sort((a, b) => {
            const aTime = a.readyAt ? Date.parse(a.readyAt) : 0;
            const bTime = b.readyAt ? Date.parse(b.readyAt) : 0;
            return bTime - aTime;
          })[0];
          if (latest) triggerPassAlert(latest, announcementGroups);
        }
      }
      prevPassIdsRef.current = new Set(newSignals.map((signal) => signal.id));
      passBaselineSetRef.current = true;
      setPassSignals(newSignals);
    } else {
      if (passRes.status === 401) {
        setPassSignals([]);
        prevPassIdsRef.current = new Set();
        passBaselineSetRef.current = false;
      }
      if (callsRes.ok && passRes.status >= 400) {
        const passError = typeof passData.error === "string" ? passData.error : null;
        if (passError) setFlash({ type: "error", text: passError });
      }
    }

    if (orgPendingRes?.ok) {
      const orgData = (await orgPendingRes.json().catch(() => ({}))) as {
        byVenue?: Record<string, number>;
      };
      if (generation === loadGenerationRef.current && orgData.byVenue) {
        setPendingByVenue(orgData.byVenue);
      }
    } else if (managerView && generation === loadGenerationRef.current) {
      setPendingByVenue({});
    }
  }, [staffKey, staffViaCookie, venueId, W.sessionExpired, W.loadFailed, setFlash]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setCalls([]);
    setPassSignals([]);
    setSpots([]);
    spotsRef.current = [];
    setPendingCount(0);
    prevPendingRef.current = null;
    prevCallsRef.current = [];
    prevPassIdsRef.current = new Set();
    pendingBaselineSetRef.current = false;
    passBaselineSetRef.current = false;
    lastPassAlertIdRef.current = null;
    lastWaiterCallAlertIdRef.current = null;
    autoZoneAppliedRef.current = false;
    zoneFilterUserPickedRef.current = false;
    setZoneFilterId("all");
    setPendingByVenue({});
  }, [venueId]);

  useEffect(() => {
    if (!pendingBaselineSetRef.current || prevPendingRef.current === null) return;
    if (pendingCount > prevPendingRef.current && document.visibilityState === "visible") {
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

  /** Locked when staff has a specific space (not «all») or share link includes ?zone=. */
  const assignedZoneId = useMemo(() => {
    const raw = initialZoneId?.trim();
    if (!raw || raw === "all") return null;
    if (!staffMember && !staffViaCookie && !staffKey) return null;
    return zoneGroups.some((zone) => zone.id === raw) ? raw : null;
  }, [staffMember, staffViaCookie, staffKey, initialZoneId, zoneGroups]);
  assignedZoneIdRef.current = assignedZoneId;

  useEffect(() => {
    if (!assignedZoneId || zoneGroups.length === 0) return;
    setZoneFilterId(assignedZoneId);
    zoneFilterUserPickedRef.current = false;
  }, [assignedZoneId, zoneGroups]);

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
      if (!isMonitorPendingCall(call)) continue;
      if (!zoneIdForWaiterLocationView(call, zoneGroups)) count += 1;
    }
    for (const pass of passSignals) {
      if (!isMonitorPendingPass(pass)) continue;
      if (!zoneIdForWaiterLocationView(pass, zoneGroups)) count += 1;
    }
    return count;
  }, [calls, passSignals, zoneGroups]);

  const zonePendingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const call of calls) {
      if (!isMonitorPendingCall(call)) continue;
      const zoneId = zoneIdForWaiterLocationView(call, zoneGroups);
      if (!zoneId) continue;
      counts.set(zoneId, (counts.get(zoneId) ?? 0) + 1);
    }
    for (const pass of passSignals) {
      if (!isMonitorPendingPass(pass)) continue;
      const zoneId = zoneIdForWaiterLocationView(pass, zoneGroups);
      if (!zoneId) continue;
      counts.set(zoneId, (counts.get(zoneId) ?? 0) + 1);
    }
    return counts;
  }, [calls, passSignals, zoneGroups]);

  const zonePendingBreakdown = useMemo(() => {
    const parts: string[] = [];
    for (const zone of activeZoneGroups) {
      const n = zonePendingCounts.get(zone.id) ?? 0;
      if (n > 0) parts.push(`${zone.label} (${n})`);
    }
    if (unmappedActiveCount > 0) {
      parts.push(W.unmappedZoneLabel(unmappedActiveCount));
    }
    return parts;
  }, [activeZoneGroups, zonePendingCounts, unmappedActiveCount, W]);

  function zonePendingTotal(zoneId: string): number {
    if (zoneId === "all") {
      const activeCalls = calls.filter(isMonitorPendingCall).length;
      const activePasses = passSignals.filter(isMonitorPendingPass).length;
      return activeCalls + activePasses;
    }
    return zonePendingCounts.get(zoneId) ?? 0;
  }

  const venueActiveTotal = zonePendingTotal("all");
  const showZoneFilters = activeZoneGroups.length > 1 && !assignedZoneId;

  const otherVenuePendingParts = useMemo(() => {
    if (staffKey || staffViaCookie) return [];
    return venues
      .filter((v) => v.id !== venueId && (pendingByVenue[v.id] ?? 0) > 0)
      .map((v) => W.otherVenuePendingPart(v.name, pendingByVenue[v.id] ?? 0));
  }, [venues, venueId, pendingByVenue, staffKey, staffViaCookie, W]);

  useEffect(() => {
    if (staffKey || staffViaCookie) return;
    if (zoneFilterUserPickedRef.current || autoZoneAppliedRef.current || assignedZoneId || !showZoneFilters) return;
    if (venueActiveTotal === 0) return;

    let bestZoneId = "all";
    let bestCount = unmappedActiveCount;
    for (const zone of activeZoneGroups) {
      const n = zonePendingCounts.get(zone.id) ?? 0;
      if (n > bestCount) {
        bestCount = n;
        bestZoneId = zone.id;
      }
    }
    if (bestZoneId !== "all" && bestCount > 0) {
      setZoneFilterId(bestZoneId);
    }
    autoZoneAppliedRef.current = true;
  }, [
    venueActiveTotal,
    unmappedActiveCount,
    zonePendingCounts,
    activeZoneGroups,
    assignedZoneId,
    showZoneFilters,
    staffKey,
    staffViaCookie,
  ]);

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

  function zoneSpotCount(zoneId: string): number {
    if (zoneId === "all") return spots.length;
    return activeZoneGroups.find((zone) => zone.id === zoneId)?.spots.length ?? 0;
  }

  function renderZoneButton(zoneId: string, label: string) {
    const selected = zoneFilterId === zoneId;
    const activePending = zonePendingTotal(zoneId);
    const spotCount = zoneSpotCount(zoneId);
    const hasMessages = activePending > 0;
    return (
      <button
        key={zoneId}
        type="button"
        onClick={() => {
          unlockWaiterAudio();
          zoneFilterUserPickedRef.current = true;
          setZoneFilterId(zoneId);
        }}
        className={cn(
          "relative flex min-h-[4.5rem] w-[calc(50%-0.25rem)] max-w-[9.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-3 py-3 text-center transition sm:min-h-[4.75rem] sm:w-[calc(33.333%-0.5rem)] sm:px-4 lg:w-[calc(25%-0.5rem)]",
          selected
            ? "border-brand-blue bg-brand-blue text-white shadow-md shadow-brand-blue/20"
            : hasMessages
              ? "border-amber-300 bg-amber-50 text-brand-navy hover:border-amber-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        )}
      >
        {hasMessages && !selected ? (
          <DashboardCountBadge
            count={activePending}
            className="absolute -right-1.5 -top-1.5 min-h-[1.35rem] min-w-[1.35rem] border-2 border-white text-[11px] shadow-md"
          />
        ) : null}
        {hasMessages && selected ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[10px] font-bold text-amber-950 shadow-md">
            {activePending}
          </span>
        ) : null}
        <span className={cn("text-sm font-bold leading-tight sm:text-base", selected && "text-white")}>
          {label}
        </span>
        {hasMessages ? (
          <>
            <span
              className={cn(
                "text-2xl font-extrabold tabular-nums leading-none sm:text-3xl",
                selected ? "text-white" : "text-amber-700",
              )}
            >
              {activePending}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold sm:text-xs",
                selected ? "text-amber-100" : "text-amber-800",
              )}
            >
              {W.zoneMessageCount(activePending)}
            </span>
            <span className={cn("text-[10px] sm:text-xs", selected ? "text-white/75" : "text-slate-400")}>
              {W.zoneSpotCount(spotCount)}
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
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
    <div className="space-y-2 sm:space-y-4" onPointerDown={() => unlockWaiterAudio()}>
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {assignedZoneId && assignedZoneLabel ? (
        staffViaCookie ? (
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-brand-navy">
              {assignedZoneLabel}
              <span className="font-normal text-slate-500">
                {" "}
                · {W.zoneSpotCount(zoneSpotCount(assignedZoneId))}
              </span>
            </p>
            {staffMember ? <StaffNameChip name={staffMember.name} /> : null}
          </div>
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
      ) : (
        <>
          {isManagerView && otherVenuePendingParts.length > 0 && venueActiveTotal === 0 ? (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="text-sm font-medium text-amber-950">
                {W.otherVenuePendingHint(otherVenuePendingParts)}
              </p>
            </section>
          ) : null}
          {showZoneFilters ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          {venueActiveTotal > 0 && zonePendingBreakdown.length > 0 ? (
            <p className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-semibold text-cyan-950">
              {W.whereToGoHeading(venueActiveTotal)} {zonePendingBreakdown.join(" · ")}
            </p>
          ) : null}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:mb-3 sm:text-sm">
            {W.zonePickHeading}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {renderZoneButton("all", W.zoneFilterAll)}
            {activeZoneGroups.map((zone) => renderZoneButton(zone.id, zone.label))}
          </div>
          {unmappedActiveCount > 0 &&
          venueActiveTotal > 0 &&
          activeZoneGroups.every((zone) => (zonePendingCounts.get(zone.id) ?? 0) === 0) ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:text-sm">
              {W.unmappedActiveHint(unmappedActiveCount)}
            </p>
          ) : null}
        </section>
          ) : null}
        </>
      )}

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
