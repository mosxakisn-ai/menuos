"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import {
  formatVenueSpotLabelForLang,
  formatWaiterCallLocationForLang,
  passStationDbToInput,
  type PassStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { athensPeriodStartYmd, athensTodayYmd } from "@/lib/athens-day";

type HistorySignal = {
  id: string;
  station: string;
  stationScreenLabel?: string | null;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  message: string | null;
  readyAt: string;
  deliveredAt: string | null;
  deliveredByStaffMemberName?: string | null;
};

type VenueSpot = { id: string; type: VenueSpotType; label: string };
type StaffMember = { id: string; name: string };

const STATION_FILTERS: PassStationInput[] = ["kitchen", "bar", "cold", "dessert"];

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
  const [spots, setSpots] = useState<VenueSpot[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [days, setDays] = useState(7);
  const [day, setDay] = useState("");
  const [spotId, setSpotId] = useState("");
  const [station, setStation] = useState("");
  const [staffMemberId, setStaffMemberId] = useState("");
  const loadGenerationRef = useRef(0);

  useEffect(() => {
    if (venues.length === 0) {
      setVenueId("");
      return;
    }
    if (!venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
      setSpotId("");
      setStation("");
      setStaffMemberId("");
    }
  }, [venues, venueId]);

  useEffect(() => {
    loadGenerationRef.current += 1;
    setSignals([]);
    setSpots([]);
    setStaffMembers([]);
    setLoadError(false);
    setDay("");
  }, [venueId]);

  useEffect(() => {
    if (!venueId) {
      setSpots([]);
      setStaffMembers([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [spotsRes, staffRes] = await Promise.all([
        fetch(`/api/venues/${venueId}/spots`),
        fetch(`/api/venues/${venueId}/staff-members`),
      ]);
      if (cancelled) return;
      const spotsData = spotsRes.ok ? ((await spotsRes.json()) as { spots?: VenueSpot[] }) : {};
      const staffData = staffRes.ok ? ((await staffRes.json()) as { members?: StaffMember[] }) : {};
      setSpots(spotsData.spots ?? []);
      setStaffMembers(staffData.members ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [venueId]);

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
      const params = new URLSearchParams({ venueId, days: String(days) });
      if (spotId) params.set("spotId", spotId);
      if (station) params.set("station", station);
      if (staffMemberId) params.set("staffMemberId", staffMemberId);
      if (day) params.set("date", day);
      const res = await fetch(`/api/pass-signals/history?${params}`);
      const data = await res.json();
      if (generation !== loadGenerationRef.current) return;
      if (!res.ok) {
        setSignals([]);
        setLoadError(true);
        return;
      }
      setSignals(data.signals ?? []);
    } catch {
      if (generation !== loadGenerationRef.current) return;
      setSignals([]);
      setLoadError(true);
    } finally {
      if (generation === loadGenerationRef.current) setLoading(false);
    }
  }, [venueId, days, day, spotId, station, staffMemberId]);

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
      <div className="mt-4 flex flex-wrap items-end gap-4">
        {venues.length > 1 ? (
          <label className="block min-w-[180px]">
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                setSpotId("");
                setStation("");
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
        <label className="block min-w-[140px]">
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
        <label className="block min-w-[160px]">
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
        <label className="block min-w-[160px]">
          <span className={dashboardLabelClass}>{H.filterSpot}</span>
          <select
            value={spotId}
            onChange={(e) => setSpotId(e.target.value)}
            className={dashboardFieldClass}
          >
            <option value="">{H.filterAll}</option>
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[140px]">
          <span className={dashboardLabelClass}>{H.filterStation}</span>
          <select
            value={station}
            onChange={(e) => setStation(e.target.value)}
            className={dashboardFieldClass}
          >
            <option value="">{H.filterAll}</option>
            {STATION_FILTERS.map((key) => (
              <option key={key} value={key}>
                {W.passStation[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-[160px]">
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

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{H.loading}</p>
      ) : loadError ? (
        <p className="mt-6 text-sm text-red-600">{H.failed}</p>
      ) : signals.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{H.empty}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">{H.colSpot}</th>
                <th className="pb-3 pr-4 font-medium">{H.colStation}</th>
                <th className="pb-3 pr-4 font-medium">{H.colMessage}</th>
                <th className="pb-3 pr-4 font-medium">{H.colStaff}</th>
                <th className="pb-3 pr-4 font-medium">{H.colReady}</th>
                <th className="pb-3 font-medium">{H.colDuration}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {signals.map((signal) => {
                const stationKey = passStationDbToInput(signal.station);
                const baseStationLabel =
                  W.passStation[stationKey as keyof typeof W.passStation] ?? signal.station;
                const stationLabel = signal.stationScreenLabel?.trim()
                  ? `${baseStationLabel} (${signal.stationScreenLabel.trim()})`
                  : baseStationLabel;
                const readyAt = new Date(signal.readyAt);
                const deliveredAt = signal.deliveredAt ? new Date(signal.deliveredAt) : null;
                const duration =
                  deliveredAt != null
                    ? formatDurationMs(deliveredAt.getTime() - readyAt.getTime())
                    : "—";

                return (
                  <tr key={signal.id}>
                    <td className="py-3 pr-4 font-medium text-brand-navy">
                      {formatWaiterCallLocationForLang(signal, lang)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{stationLabel}</td>
                    <td className="py-3 pr-4 text-slate-600">{signal.message?.trim() || "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      {signal.deliveredByStaffMemberName?.trim() || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {readyAt.toLocaleString(locale)}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">{duration}</td>
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
