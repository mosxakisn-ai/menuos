"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  applyZoneLabelOverrides,
  formatWaiterCallLocationWithZone,
  groupVenueSpotsByZone,
  passStationDbToInput,
} from "@menuos/shared";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import { athensPeriodStartYmd, athensTodayYmd } from "@/lib/athens-day";

type HistorySignal = {
  id: string;
  station: string;
  stationScreenId?: string | null;
  stationScreenLabel?: string | null;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  zoneId?: string | null;
  message: string | null;
  readyAt: string;
  deliveredAt: string | null;
  deliveredByStaffMemberName?: string | null;
};

type StaffMember = { id: string; name: string };
type PassStationScreen = { id: string; label: string; station?: string };

type HistoryLimit = 50 | 100 | "all";

function formatHistoryPostLabel(
  signal: HistorySignal,
  passStationLabels: Record<string, string>,
  stationScreens: PassStationScreen[],
): string {
  const custom = signal.stationScreenLabel?.trim();
  if (custom) return custom;

  const screenId = signal.stationScreenId?.trim();
  if (screenId) {
    const byId = stationScreens.find((screen) => screen.id === screenId);
    if (byId) return byId.label;
  }

  const stationKey = passStationDbToInput(signal.station);
  const forStation = stationScreens.filter((screen) => screen.station === stationKey);
  if (forStation.length === 1) return forStation[0]!.label;

  return passStationLabels[stationKey] ?? signal.station;
}

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}′`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}′` : `${h}h`;
}

export function PassSignalHistoryPanel({ venues }: { venues: { id: string; name: string }[] }) {
  const { d, lang } = useDashboardCopy();
  const H = d.pages.history;
  const W = d.waiter;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [signals, setSignals] = useState<HistorySignal[]>([]);
  const [stationScreens, setStationScreens] = useState<PassStationScreen[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [days, setDays] = useState(7);
  const [day, setDay] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [stationScreenId, setStationScreenId] = useState("");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [recordLimit, setRecordLimit] = useState<HistoryLimit>(50);
  const [truncated, setTruncated] = useState(false);
  const loadGenerationRef = useRef(0);

  const { spots } = useVenueSpots(venueId);
  const { config: opsConfig } = useVenueOperationsConfig(venueId);

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const activeZoneGroups = useMemo(
    () => zoneGroups.filter((zone) => zone.spots.length > 0),
    [zoneGroups],
  );

  useEffect(() => {
    if (venues.length === 0) {
      setVenueId("");
      return;
    }
    if (!venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
      setZoneId("");
      setStationScreenId("");
      setStaffMemberId("");
    }
  }, [venues, venueId]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setSignals([]);
    setStationScreens([]);
    setStaffMembers([]);
    setLoadError(false);
    setDay("");
    setZoneId("");
    setStationScreenId("");
    setStaffMemberId("");
  }, [venueId]);

  useEffect(() => {
    if (!venueId) {
      setStationScreens([]);
      setStaffMembers([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [screensRes, staffRes] = await Promise.all([
        fetch(`/api/venues/${venueId}/station-screens`),
        fetch(`/api/venues/${venueId}/staff-members`),
      ]);
      if (cancelled) return;
      const screensData = screensRes.ok
        ? ((await screensRes.json()) as { screens?: PassStationScreen[] })
        : {};
      const staffData = staffRes.ok ? ((await staffRes.json()) as { members?: StaffMember[] }) : {};
      setStationScreens(screensData.screens ?? []);
      setStaffMembers(staffData.members ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

  useEffect(() => {
    if (!stationScreenId) return;
    if (!stationScreens.some((screen) => screen.id === stationScreenId)) {
      setStationScreenId("");
    }
  }, [stationScreenId, stationScreens]);

  useEffect(() => {
    if (!zoneId) return;
    if (!activeZoneGroups.some((zone) => zone.id === zoneId)) {
      setZoneId("");
    }
  }, [zoneId, activeZoneGroups]);

  useEffect(() => {
    if (!staffMemberId) return;
    if (!staffMembers.some((member) => member.id === staffMemberId)) {
      setStaffMemberId("");
    }
  }, [staffMemberId, staffMembers]);

  const load = useCallback(async () => {
    if (!venueId) {
      setSignals([]);
      setLoadError(false);
      return;
    }
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({
        venueId,
        days: String(days),
        limit: recordLimit === "all" ? "all" : String(recordLimit),
      });
      if (zoneId) params.set("zoneId", zoneId);
      if (stationScreenId) params.set("stationScreenId", stationScreenId);
      if (staffMemberId) params.set("staffMemberId", staffMemberId);
      if (day) params.set("date", day);
      const res = await fetch(`/api/pass-signals/history?${params}`);
      const data = await res.json();
      if (generation !== loadGenerationRef.current) return;
      if (!res.ok) {
        setSignals([]);
        setTruncated(false);
        setLoadError(true);
        return;
      }
      setSignals(data.signals ?? []);
      setTruncated(Boolean(data.truncated));
    } catch {
      if (generation !== loadGenerationRef.current) return;
      setSignals([]);
      setTruncated(false);
      setLoadError(true);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [venueId, days, day, zoneId, stationScreenId, staffMemberId, recordLimit]);

  useEffect(() => {
    void load();
  }, [load]);

  const todayYmd = useMemo(() => athensTodayYmd(), []);
  const minDayYmd = useMemo(() => athensPeriodStartYmd(days), [days]);

  useEffect(() => {
    if (!day) return;
    if (day > todayYmd || day < minDayYmd) setDay("");
  }, [day, days, todayYmd, minDayYmd]);

  if (venues.length === 0) return null;

  const locale = lang === "EN" ? "en-GB" : "el-GR";

  return (
    <div className={dashboardCardClass}>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {venues.length > 1 ? (
          <label className="block min-w-0">
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                setZoneId("");
                setStationScreenId("");
                setStaffMemberId("");
              }}
              className={dashboardFieldClass}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block min-w-0">
          <span className={dashboardLabelClass}>{H.daysLabel}</span>
          <select
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setDay("");
            }}
            className={dashboardFieldClass}
          >
            <option value={7}>{H.days7}</option>
            <option value={30}>{H.days30}</option>
            <option value={90}>{H.days90}</option>
          </select>
        </label>
        <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
          <span className={dashboardLabelClass}>{H.filterDay}</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={day}
              min={minDayYmd}
              max={todayYmd}
              onChange={(e) => setDay(e.target.value)}
              className={dashboardFieldClass}
            />
            {day ? (
              <button
                type="button"
                onClick={() => setDay("")}
                className="shrink-0 text-xs font-medium text-brand-blue hover:underline"
              >
                {H.filterDayClear}
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] leading-snug text-slate-500">{H.filterDayHint}</p>
        </label>
        <label className="block min-w-0">
          <span className={dashboardLabelClass}>{H.filterSpot}</span>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className={dashboardFieldClass}
            disabled={activeZoneGroups.length === 0}
          >
            <option value="">{H.filterAll}</option>
            {activeZoneGroups.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className={dashboardLabelClass}>{H.filterPost}</span>
          <select
            value={stationScreenId}
            onChange={(e) => setStationScreenId(e.target.value)}
            className={dashboardFieldClass}
          >
            <option value="">{H.filterAll}</option>
            {stationScreens.map((screen) => (
              <option key={screen.id} value={screen.id}>
                {screen.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0">
          <span className={dashboardLabelClass}>{H.filterStaff}</span>
          <select
            value={staffMemberId}
            onChange={(e) => setStaffMemberId(e.target.value)}
            className={dashboardFieldClass}
          >
            <option value="">{H.filterAll}</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className={dashboardLabelClass}>{H.limitLabel}</span>
          <select
            value={recordLimit}
            onChange={(e) => {
              const value = e.target.value;
              setRecordLimit(value === "all" ? "all" : (Number(value) as 50 | 100));
            }}
            className={`${dashboardFieldClass} w-auto min-w-[9rem]`}
          >
            <option value={50}>{H.limit50}</option>
            <option value={100}>{H.limit100}</option>
            <option value="all">{H.limitAll}</option>
          </select>
        </label>
        {!loading && !loadError && signals.length > 0 ? (
          <p className="text-xs text-slate-500">
            {H.showingCount(signals.length, recordLimit)}
            {truncated ? ` · ${H.truncatedHint}` : ""}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{H.loading}</p>
      ) : loadError ? (
        <p className="mt-6 text-sm text-red-600">{H.failed}</p>
      ) : signals.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{H.empty}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-[14%] pb-3 pr-3">{H.colSpot}</th>
                <th className="w-[16%] pb-3 pr-3">{H.colPost}</th>
                <th className="w-[26%] pb-3 pr-3">{H.colMessage}</th>
                <th className="w-[14%] pb-3 pr-3">{H.colStaff}</th>
                <th className="w-[20%] pb-3 pr-3">{H.colReady}</th>
                <th className="w-[10%] pb-3 text-right">{H.colDuration}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {signals.map((signal) => {
                const postLabel = formatHistoryPostLabel(signal, W.passStation, stationScreens);
                const readyAt = new Date(signal.readyAt);
                const deliveredAt = signal.deliveredAt ? new Date(signal.deliveredAt) : null;
                const duration =
                  deliveredAt != null
                    ? formatDurationMs(deliveredAt.getTime() - readyAt.getTime())
                    : "—";
                const locationLabel = formatWaiterCallLocationWithZone(signal, zoneGroups, { lang });

                return (
                  <tr key={signal.id} className="align-top">
                    <td className="py-3 pr-3 font-medium text-brand-navy">{locationLabel}</td>
                    <td className="py-3 pr-3 text-slate-700">{postLabel}</td>
                    <td className="py-3 pr-3 text-slate-600">{signal.message?.trim() || "—"}</td>
                    <td className="py-3 pr-3 text-slate-600">
                      {signal.deliveredByStaffMemberName?.trim() || "—"}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {readyAt.toLocaleString(locale)}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-700">{duration}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
