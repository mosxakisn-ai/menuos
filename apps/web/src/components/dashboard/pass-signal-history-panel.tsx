"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatWaiterCallLocationForLang, passStationDbToInput } from "@menuos/shared";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type HistorySignal = {
  id: string;
  station: string;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  message: string | null;
  readyAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

function formatDurationMs(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}′`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}′` : `${h}h`;
}

export function PassSignalHistoryPanel({ venues }: { venues: { id: string; name: string }[] }) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings.services;
  const W = d.waiter;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [signals, setSignals] = useState<HistorySignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (venues.length === 0) {
      setVenueId("");
      return;
    }
    if (!venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  const load = useCallback(async () => {
    if (!venueId) {
      setSignals([]);
      setLoadError(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams({ venueId, days: String(days) });
      const res = await fetch(`/api/pass-signals/history?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setSignals([]);
        setLoadError(true);
        return;
      }
      setSignals(data.signals ?? []);
    } catch {
      setSignals([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [venueId, days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (venues.length === 0) return null;

  const locale = lang === "EN" ? "en-GB" : "el-GR";

  return (
    <div className={dashboardCardClass}>
      <h2 className="text-sm font-semibold text-primary">{S.historyTitle}</h2>
      <p className="mt-2 text-sm text-slate-600">{S.historyHint}</p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        {venues.length > 1 ? (
          <label className="block min-w-[180px]">
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
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
          <span className={dashboardLabelClass}>{S.historyDaysLabel}</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={dashboardFieldClass}
          >
            <option value={7}>{S.historyDays7}</option>
            <option value={30}>{S.historyDays30}</option>
            <option value={90}>{S.historyDays90}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{S.historyLoading}</p>
      ) : loadError ? (
        <p className="mt-6 text-sm text-red-600">{S.historyFailed}</p>
      ) : signals.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">{S.historyEmpty}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">{S.historyColSpot}</th>
                <th className="pb-3 pr-4 font-medium">{S.historyColStation}</th>
                <th className="pb-3 pr-4 font-medium">{S.historyColMessage}</th>
                <th className="pb-3 pr-4 font-medium">{S.historyColReady}</th>
                <th className="pb-3 font-medium">{S.historyColDuration}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {signals.map((signal) => {
                const stationKey = passStationDbToInput(signal.station);
                const stationLabel =
                  W.passStation[stationKey as keyof typeof W.passStation] ?? signal.station;
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
