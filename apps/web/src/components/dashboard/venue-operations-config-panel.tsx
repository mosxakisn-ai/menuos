"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PassStationInput, TableTileState, VenueOperationsConfig } from "@menuos/shared";
import {
  DEFAULT_PASS_QUICK_CHIPS,
  DEFAULT_STATION_LABELS_EL,
  DEFAULT_STATION_LABELS_EN,
  DEFAULT_TABLE_STATE_LABELS_EL,
  groupVenueSpotsByZone,
  mergeTableStateLabels,
  PASS_STATION_INPUTS,
  stationDisplayLabel,
  TABLE_TILE_STATES,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  DashboardSectionTitle,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { TableGridLegend } from "@/components/dashboard/table-grid-preview";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";

type Venue = { id: string; name: string };

export type OpsConfigSection = "departments" | "chips" | "map" | "zones";

const ALL_OPS_SECTIONS: OpsConfigSection[] = ["departments", "chips", "map", "zones"];

const STATION_LABEL_KEYS: Record<PassStationInput, "kitchen" | "bar" | "cold" | "dessert"> = {
  kitchen: "kitchen",
  bar: "bar",
  cold: "cold",
  dessert: "dessert",
};

function defaultStationLabel(station: PassStationInput, lang: "GR" | "EN"): string {
  return lang === "EN" ? DEFAULT_STATION_LABELS_EN[station] : DEFAULT_STATION_LABELS_EL[station];
}

export function useVenueOperationsConfig(venueId: string) {
  const [config, setConfig] = useState<VenueOperationsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!venueId) {
      setConfig(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/operations-config`);
      const data = (await res.json()) as { config?: VenueOperationsConfig };
      if (res.ok && data.config) setConfig(data.config);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { config, loading, reload, setConfig };
}

function ChipEditor({
  chips,
  onChange,
  placeholder,
}: {
  chips: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function addChip() {
    const value = draft.trim();
    if (!value || chips.includes(value) || chips.length >= 12) return;
    onChange([...chips, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {chip}
            <button
              type="button"
              onClick={() => onChange(chips.filter((c) => c !== chip))}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Remove ${chip}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addChip();
            }
          }}
          placeholder={placeholder}
          maxLength={60}
          className={`${dashboardFieldClass} min-w-0 flex-1 text-sm`}
        />
        <button type="button" onClick={addChip} className={buttonClass("secondary", "sm")}>
          +
        </button>
      </div>
    </div>
  );
}

export function VenueOperationsConfigPanel({
  venues,
  initialVenueId,
  sections = ALL_OPS_SECTIONS,
  showHeader = true,
}: {
  venues: Venue[];
  initialVenueId?: string;
  sections?: OpsConfigSection[];
  showHeader?: boolean;
}) {
  const { d, lang } = useDashboardCopy();
  const O = d.pages.settings.operations;
  const P = d.pages.settings.personnel.stationLabels;
  const show = (s: OpsConfigSection) => sections.includes(s);
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const { spots: panelSpots } = useVenueSpots(venueId);
  const zoneGroups = useMemo(
    () => groupVenueSpotsByZone(panelSpots.map((s) => ({ type: s.type, label: s.label }))),
    [panelSpots],
  );
  const { config, loading, reload, setConfig } = useVenueOperationsConfig(venueId);
  const { flash, setFlash, showFromResponse } = useFlashMessage();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<VenueOperationsConfig | null>(null);

  useEffect(() => {
    if (initialVenueId) setVenueId(initialVenueId);
  }, [initialVenueId]);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  if (venues.length === 0) return null;

  const stateLabelDefaults =
    lang === "EN" ? mergeTableStateLabels(undefined, "EN") : DEFAULT_TABLE_STATE_LABELS_EL;

  async function save() {
    if (!venueId || !draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/operations-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok && data.config) {
        setConfig(data.config);
        setDraft(data.config);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleStation(station: PassStationInput) {
    if (!draft) return;
    const enabled = draft.enabledStations.includes(station);
    let next = enabled
      ? draft.enabledStations.filter((s) => s !== station)
      : [...draft.enabledStations, station];
    if (next.length === 0) next = [station];
    setDraft({ ...draft, enabledStations: next });
  }

  function setQuickChips(station: PassStationInput, chips: string[]) {
    if (!draft) return;
    setDraft({
      ...draft,
      quickChips: { ...(draft.quickChips ?? {}), [station]: chips },
    });
  }

  function resetQuickChips(station: PassStationInput) {
    if (!draft) return;
    const next = { ...(draft.quickChips ?? {}) };
    delete next[station];
    setDraft({ ...draft, quickChips: Object.keys(next).length ? next : undefined });
  }

  function setStationLabel(station: PassStationInput, value: string) {
    if (!draft) return;
    const trimmed = value.trim();
    const next = { ...(draft.stationLabels ?? {}) };
    const fallback = defaultStationLabel(station, lang === "EN" ? "EN" : "GR");
    if (!trimmed || trimmed === fallback) {
      delete next[station];
    } else {
      next[station] = trimmed;
    }
    setDraft({
      ...draft,
      stationLabels: Object.keys(next).length ? next : undefined,
    });
  }

  function setTableStateLabel(state: TableTileState, value: string) {
    if (!draft) return;
    const trimmed = value.trim();
    const next = { ...(draft.tableStateLabels ?? {}) };
    if (!trimmed || trimmed === stateLabelDefaults[state]) {
      delete next[state];
    } else {
      next[state] = trimmed;
    }
    setDraft({
      ...draft,
      tableStateLabels: Object.keys(next).length ? next : undefined,
    });
  }

  function setZoneLabel(zoneId: string, value: string) {
    if (!draft) return;
    const trimmed = value.trim();
    const autoLabel = zoneGroups?.find((z) => z.id === zoneId)?.label ?? zoneId;
    const next = { ...(draft.zoneLabels ?? {}) };
    if (!trimmed || trimmed === autoLabel) {
      delete next[zoneId];
    } else {
      next[zoneId] = trimmed;
    }
    setDraft({
      ...draft,
      zoneLabels: Object.keys(next).length ? next : undefined,
    });
  }

  const previewLabels = draft
    ? mergeTableStateLabels(draft, lang === "EN" ? "EN" : "GR")
    : stateLabelDefaults;

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        {showHeader ? (
          <DashboardSectionTitle title={O.title} description={O.description} />
        ) : null}

        {venues.length > 1 ? (
          <label className={showHeader ? "mt-4 block max-w-md" : "block max-w-md"}>
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

        {loading || !draft ? (
          <p className="mt-4 text-sm text-slate-500">{O.loading}</p>
        ) : (
          <div className={showHeader ? "mt-6 space-y-8" : "mt-4 space-y-8"}>
            {show("departments") ? (
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">{O.departmentsTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{O.departmentsHint}</p>
              <ul className="mt-3 space-y-2">
                {PASS_STATION_INPUTS.map((station) => {
                  const active = draft.enabledStations.includes(station);
                  const displayName = stationDisplayLabel(
                    draft,
                    station,
                    lang === "EN" ? "EN" : "GR",
                  );
                  return (
                    <li
                      key={station}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                        active
                          ? "border-brand-blue/30 bg-brand-blue/5"
                          : "border-slate-100 bg-white opacity-80"
                      }`}
                    >
                      <label className="inline-flex shrink-0 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleStation(station)}
                          className="accent-brand-blue"
                        />
                        <span className="sr-only">{P[STATION_LABEL_KEYS[station]]}</span>
                      </label>
                      <input
                        value={displayName}
                        onChange={(e) => setStationLabel(station, e.target.value)}
                        maxLength={40}
                        placeholder={P[STATION_LABEL_KEYS[station]]}
                        className={`${dashboardFieldClass} min-w-[10rem] flex-1 text-sm`}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
            ) : null}

            {show("chips") ? (
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">{O.quickChipsTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{O.quickChipsHint}</p>
              <div className="mt-4 space-y-5">
                {PASS_STATION_INPUTS.filter((s) => draft.enabledStations.includes(s)).map(
                  (station) => {
                    const chips = draft.quickChips?.[station] ?? DEFAULT_PASS_QUICK_CHIPS[station];
                    const deptName = stationDisplayLabel(
                      draft,
                      station,
                      lang === "EN" ? "EN" : "GR",
                    );
                    return (
                      <div
                        key={station}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
                            {deptName}
                          </p>
                          <button
                            type="button"
                            onClick={() => resetQuickChips(station)}
                            className="text-xs font-medium text-slate-500 hover:text-brand-blue"
                          >
                            {O.resetDefaults}
                          </button>
                        </div>
                        <ChipEditor
                          chips={chips}
                          onChange={(next) => setQuickChips(station, next)}
                          placeholder={O.chipPlaceholder}
                        />
                      </div>
                    );
                  },
                )}
              </div>
            </section>
            ) : null}

            {show("map") ? (
            <section>
              <h3 className="text-sm font-semibold text-brand-navy">{O.mapLabelsTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">{O.mapLabelsHint}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {TABLE_TILE_STATES.map((state) => (
                  <label key={state} className="block">
                    <span className="text-xs font-medium text-slate-500">
                      {stateLabelDefaults[state]}
                    </span>
                    <input
                      value={draft.tableStateLabels?.[state] ?? stateLabelDefaults[state]}
                      onChange={(e) => setTableStateLabel(state, e.target.value)}
                      maxLength={40}
                      className={`${dashboardFieldClass} mt-1 text-sm`}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <TableGridLegend stateLabels={previewLabels} />
              </div>
            </section>
            ) : null}

            {show("zones") && zoneGroups && zoneGroups.length > 0 ? (
              <section>
                <h3 className="text-sm font-semibold text-brand-navy">{O.zonesTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{O.zonesHint}</p>
                <ul className="mt-3 space-y-2">
                  {zoneGroups.map((zone) => (
                    <li
                      key={zone.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <span className="text-xs text-slate-400">{zone.id}</span>
                      <input
                        value={draft.zoneLabels?.[zone.id] ?? zone.label}
                        onChange={(e) => setZoneLabel(zone.id, e.target.value)}
                        maxLength={40}
                        className={`${dashboardFieldClass} min-w-[10rem] flex-1 text-sm`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className={buttonClass("primary")}
              >
                {saving ? O.saving : O.save}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void reload()}
                className={buttonClass("secondary")}
              >
                {O.reload}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
