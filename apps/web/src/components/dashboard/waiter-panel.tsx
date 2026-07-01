"use client";

import { Bell, Check, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatWaiterCallLocationForLang, formatOrderLineDetail, passStationDbToInput, type OrderLine, type VenueSpotType } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { WaiterShareLink } from "@/components/dashboard/waiter-share-link";
import { WaiterTableGrid } from "@/components/dashboard/waiter-table-grid";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { alertNewWaiterCall } from "@/lib/waiter-alert";

type Venue = { id: string; name: string; slug?: string; staffToken?: string };
type OrderPayload = {
  lines: OrderLine[];
  total: string;
};
type VenueSpot = { id: string; type: VenueSpotType; label: string };
type PassSignal = {
  id: string;
  station: string;
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

function isOrderUpdated(call: WaiterCall): boolean {
  if (call.type !== "ORDER") return false;
  return new Date(call.updatedAt).getTime() - new Date(call.createdAt).getTime() > 1500;
}

export function WaiterPanel({
  venues,
  initialVenueId,
  staffKey,
  staffViaCookie = false,
  showShareLink = true,
}: {
  venues: Venue[];
  initialVenueId?: string;
  staffKey?: string;
  staffViaCookie?: boolean;
  showShareLink?: boolean;
}) {
  const { d, lang } = useDashboardCopy();
  const W = d.waiter;
  const resolvedInitial =
    initialVenueId && venues.some((v) => v.id === initialVenueId)
      ? initialVenueId
      : (venues[0]?.id ?? "");
  const [venueId, setVenueId] = useState(resolvedInitial);
  const [staffTokens, setStaffTokens] = useState<Record<string, string>>(() =>
    Object.fromEntries(venues.filter((v) => v.staffToken).map((v) => [v.id, v.staffToken!])),
  );
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [passSignals, setPassSignals] = useState<PassSignal[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);
  const [updatingPassId, setUpdatingPassId] = useState<string | null>(null);
  const prevPendingRef = useRef<number | null>(null);
  const prevPassRef = useRef<number | null>(null);
  const prevCallsRef = useRef<WaiterCall[]>([]);
  const pendingBaselineSetRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

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
      showFromResponse(data, res.ok);
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
      showFromResponse(data, res.ok);
      if (res.ok) await load();
    } finally {
      setUpdatingCallId(null);
    }
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">{W.needVenueFirst}</p>
      </Card>
    );
  }

  const activeVenue = venues.find((v) => v.id === venueId);
  const activeStaffToken = activeVenue ? (staffTokens[activeVenue.id] ?? activeVenue.staffToken) : undefined;

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {showShareLink && activeVenue?.slug && activeStaffToken ? (
        <WaiterShareLink
          venueSlug={activeVenue.slug}
          staffToken={activeStaffToken}
          venueId={staffKey ? undefined : activeVenue.id}
          onStaffTokenRotated={
            staffKey
              ? undefined
              : (newToken) => {
                  setStaffTokens((prev) => ({ ...prev, [activeVenue.id]: newToken }));
                  setFlash({ type: "success", text: d.waiter.rotateSuccess });
                }
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        {staffViaCookie || staffKey || venues.length === 1 ? (
          <p className="text-sm">
            <span className="font-medium text-brand-navy">{d.venue}: </span>
            <span className="text-slate-700">{activeVenue?.name ?? "—"}</span>
          </p>
        ) : (
          <label className="block text-sm">
            <span className="font-medium text-brand-navy">{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="mt-1 block min-w-[200px] rounded-button border border-slate-200 px-3 py-2.5"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {(pendingCount > 0 || passCount > 0) ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
            <Bell className="h-4 w-4" />
            {pendingCount > 0 ? W.pendingCount(pendingCount) : null}
            {pendingCount > 0 && passCount > 0 ? " · " : null}
            {passCount > 0 ? W.passCount(passCount) : null}
          </span>
        ) : (
          <span className="text-sm text-slate-500">{W.refreshHint}</span>
        )}
      </div>

      <WaiterTableGrid spots={spots} calls={calls} passSignals={passSignals} />

      {passSignals.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-navy">{W.passSection}</h2>
          <ul className="space-y-3">
            {passSignals.map((signal) => {
              const stationKey = passStationDbToInput(signal.station);
              const stationLabel =
                W.passStation[stationKey as keyof typeof W.passStation] ?? signal.station;
              return (
                <li key={signal.id}>
                  <Card className="border-orange-200 bg-orange-50/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-brand-navy">
                          {stationLabel}
                          {" · "}
                          {formatWaiterCallLocationForLang(signal, lang)}
                        </p>
                        {signal.message ? (
                          <p className="mt-1 text-sm text-slate-700">{signal.message}</p>
                        ) : null}
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(signal.readyAt).toLocaleString(lang === "EN" ? "en-GB" : "el-GR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {signal.status === "READY" ? (
                          <button
                            type="button"
                            disabled={updatingPassId !== null}
                            onClick={() => void updatePassStatus(signal.id, "PICKED_UP")}
                            className={buttonClass("secondary", "sm")}
                          >
                            {W.passPickedUp}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={updatingPassId !== null}
                          onClick={() => void updatePassStatus(signal.id, "DELIVERED")}
                          className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {W.passDelivered}
                        </button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {calls.length === 0 && passSignals.length === 0 && spots.length === 0 ? (
        <Card className="border-dashed text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-brand-navy">{W.emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{W.emptyDesc}</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {calls.map((call) => (
            <li key={call.id}>
              <Card
                className={
                  call.status === "PENDING" ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-brand-navy">
                      {W.callType[call.type as keyof typeof W.callType] ?? call.type}
                      {" · "}
                      {formatWaiterCallLocationForLang(call, lang)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {new Date(call.createdAt).toLocaleString(lang === "EN" ? "en-GB" : "el-GR")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {W.callStatus[call.status as keyof typeof W.callStatus] ?? call.status}
                      {isOrderUpdated(call) && call.status === "PENDING" ? (
                        <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                          {W.newItems}
                        </span>
                      ) : null}
                    </p>
                    {call.type === "ORDER" && call.orderItems?.lines?.length ? (
                      <ul className="mt-3 space-y-1 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-700">
                        {call.orderItems.lines.map((line, i) => {
                          const detail = formatOrderLineDetail(line);
                          return (
                          <li key={`${line.name}-${i}`} className="flex justify-between gap-2">
                            <span>
                              {line.quantity}× {line.name}
                              {detail ? (
                                <span className="mt-0.5 block text-xs font-normal text-slate-500">{detail}</span>
                              ) : null}
                            </span>
                            <span className="shrink-0 font-medium">
                              €{(Number(line.unitPrice) * line.quantity).toFixed(2)}
                            </span>
                          </li>
                          );
                        })}
                        <li className="flex justify-between border-t border-slate-100 pt-1 font-bold text-brand-navy">
                          <span>{W.orderTotal}</span>
                          <span>€{call.orderItems.total}</span>
                        </li>
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {call.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={updatingCallId !== null}
                        onClick={() => void updateStatus(call.id, "ACKNOWLEDGED")}
                        className={buttonClass("primary", "sm")}
                      >
                        {W.goButton}
                      </button>
                    ) : null}
                    {call.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        disabled={updatingCallId !== null}
                        onClick={() => void updateStatus(call.id, "COMPLETED")}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {W.completeButton}
                      </button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
