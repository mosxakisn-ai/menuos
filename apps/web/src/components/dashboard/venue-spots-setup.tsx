"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatVenueSpotLabelForLang,
  groupVenueSpotsByZone,
  isValidVenueSpotLabel,
  spotToQueryParams,
  type VenueSpotType,
  VENUE_SPOT_TYPES,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { TableGridLegend, TableGridPreview } from "@/components/dashboard/table-grid-preview";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  DashboardSectionTitle,
  DashboardToolbar,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { DashboardIconButton } from "@/components/dashboard/dashboard-action-button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { confirmDestructive } from "@/lib/confirm-action";
import { getSettingsDemo } from "@/content/settings-demo";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

type Venue = { id: string; name: string; slug: string };

type SpaceBulkRow = {
  id: string;
  spaceName: string;
  from: string;
  to: string;
};

let spaceRowCounter = 0;
function newSpaceRow(): SpaceBulkRow {
  spaceRowCounter += 1;
  return { id: `space-${spaceRowCounter}`, spaceName: "", from: "1", to: "" };
}

export function VenueSpotsSetup({
  venues,
  initialVenueId,
}: {
  venues: Venue[];
  initialVenueId?: string;
}) {
  const { d, lang } = useDashboardCopy();
  const Q = d.pages.qr;
  const S = d.pages.settings;
  const demo = getSettingsDemo(lang);
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const { spots, loading, reload } = useVenueSpots(venueId);
  const [spotType, setSpotType] = useState<VenueSpotType>("TABLE");
  const [label, setLabel] = useState("");
  const [spaceRows, setSpaceRows] = useState<SpaceBulkRow[]>(() => [newSpaceRow(), newSpaceRow()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const venue = venues.find((v) => v.id === venueId);

  const zoneGroups = useMemo(() => groupVenueSpotsByZone(spots), [spots]);

  const spotByKey = useMemo(() => {
    const map = new Map<string, (typeof spots)[number]>();
    for (const spot of spots) {
      map.set(`${spot.type}:${spot.label}`, spot);
    }
    return map;
  }, [spots]);

  async function addSpot(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !label.trim()) return;
    if (!isValidVenueSpotLabel(label)) {
      setFlash({ type: "error", text: Q.labelHint });
      return;
    }
    setBusy("add");
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: spotType, label: label.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setLabel("");
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function bulkAddSpaceRow(rowId: string) {
    if (!venueId) return;
    const row = spaceRows.find((r) => r.id === rowId);
    if (!row) return;

    const space = row.spaceName.trim();
    if (!space) {
      setFlash({ type: "error", text: S.tables.spaceNameRequired });
      return;
    }

    if (!row.to.trim()) {
      setFlash({ type: "error", text: Q.invalidRange });
      return;
    }

    const from = Number(row.from);
    const to = Number(row.to);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || from < 1 || to > 999) {
      setFlash({ type: "error", text: Q.invalidRange });
      return;
    }
    if (to - from >= 200) {
      setFlash({ type: "error", text: Q.bulkLimit });
      return;
    }

    const prefix = `${space}-`;
    if (!isValidVenueSpotLabel(`${prefix}${from}`)) {
      setFlash({ type: "error", text: Q.invalidPrefix(Q.labelHint) });
      return;
    }

    setBusy(rowId);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: spotType,
          from,
          to,
          prefix,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) await reload();
    } finally {
      setBusy(null);
    }
  }

  function updateSpaceRow(rowId: string, patch: Partial<Omit<SpaceBulkRow, "id">>) {
    setSpaceRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addSpaceRow() {
    setSpaceRows((rows) => [...rows, newSpaceRow()]);
  }

  function removeSpaceRow(rowId: string) {
    setSpaceRows((rows) => (rows.length <= 1 ? rows : rows.filter((row) => row.id !== rowId)));
  }

  async function removeSpot(spotId: string, name: string) {
    if (!venueId) return;
    if (!(await confirmDestructive(Q.deleteSpotConfirm(name)))) return;
    setBusy(spotId);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spotId}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        if (editingId === spotId) {
          setEditingId(null);
          setEditLabel("");
        }
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  async function saveSpotLabel(spotId: string) {
    if (!venueId || !editLabel.trim()) return;
    if (!isValidVenueSpotLabel(editLabel)) {
      setFlash({ type: "error", text: Q.labelHint });
      return;
    }
    setBusy(`edit-${spotId}`);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) {
        setEditingId(null);
        setEditLabel("");
        await reload();
      }
    } finally {
      setBusy(null);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="font-semibold text-brand-navy">{Q.needVenueTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{Q.needVenueDesc}</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {d.addVenue}
        </a>
      </div>
    );
  }

  const realTiles = spots.slice(0, 12).map((s) => ({
    label: s.label,
    state: "idle" as const,
  }));

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <DashboardSectionTitle title={S.tables.title} description={S.tables.description} />
          <a href="/dashboard/qr" className="text-sm font-semibold text-brand-blue hover:underline">
            {S.tables.qrLink}
          </a>
        </div>
        <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm leading-relaxed text-slate-600">
          {S.tables.zoneHint}
        </p>

        <DashboardToolbar className="mt-6">
          <label className="block min-w-[12rem] flex-1 sm:max-w-md">
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                setEditingId(null);
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
          <label className="block w-full sm:w-40">
            <span className={dashboardLabelClass}>{Q.spotTypeLabel}</span>
            <select
              value={spotType}
              onChange={(e) => setSpotType(e.target.value as VenueSpotType)}
              className={dashboardFieldClass}
            >
              {VENUE_SPOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {Q.spotTypes[t] ?? t}
                </option>
              ))}
            </select>
          </label>
        </DashboardToolbar>

        <div className="mt-6 space-y-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
          <div>
            <p className="text-sm font-semibold text-brand-navy">{S.tables.spacesBulkTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{S.tables.spacesBulkDesc}</p>
          </div>

          <div className="space-y-3">
            {spaceRows.map((row, index) => {
              const from = Number(row.from);
              const to = Number(row.to);
              const space = row.spaceName.trim();
              const count =
                space && Number.isFinite(from) && Number.isFinite(to) && to >= from
                  ? to - from + 1
                  : 0;
              const preview =
                count > 0 && count <= 200 ? S.tables.spacePreview(space, from, to, count) : null;

              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_5rem_5rem_auto_auto] sm:items-end">
                    <label className="block min-w-0">
                      <span className={dashboardLabelClass}>{S.tables.spaceNameLabel}</span>
                      <input
                        type="text"
                        value={row.spaceName}
                        onChange={(e) => updateSpaceRow(row.id, { spaceName: e.target.value })}
                        placeholder={FORM_PLACEHOLDERS.spotSpaceName}
                        maxLength={15}
                        className={dashboardFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={dashboardLabelClass}>{Q.fromLabel}</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={row.from}
                        onChange={(e) => updateSpaceRow(row.id, { from: e.target.value })}
                        className={dashboardFieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={dashboardLabelClass}>{Q.toLabel}</span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={row.to}
                        onChange={(e) => updateSpaceRow(row.id, { to: e.target.value })}
                        placeholder={FORM_PLACEHOLDERS.spotBulkTo}
                        className={dashboardFieldClass}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy !== null || !row.to.trim() || !space}
                      onClick={() => void bulkAddSpaceRow(row.id)}
                      className={`h-10 whitespace-nowrap ${buttonClass("primary", "md")}`}
                    >
                      {busy === row.id ? Q.bulkAdding : S.tables.addSpaceTables}
                    </button>
                    {spaceRows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSpaceRow(row.id)}
                        className={`inline-flex h-10 items-center justify-center ${buttonClass("secondary", "md")}`}
                        aria-label={Q.deleteSpotLabel}
                        title={Q.deleteSpotLabel}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="hidden sm:block" aria-hidden />
                    )}
                  </div>
                  {preview ? (
                    <p className="mt-2 text-xs text-slate-500">{preview}</p>
                  ) : index === 0 && spaceRows.length === 1 ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {lang === "EN" ? "Example: Bar 1–10, then add Hall 1–20." : "Παράδειγμα: Bar 1–10, μετά Σαλα 1–20."}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addSpaceRow}
            className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
          >
            <Plus className="h-4 w-4" />
            {S.tables.addSpaceRow}
          </button>
        </div>

        <form
          onSubmit={addSpot}
          className={`${dashboardFormGridClass} mt-6 items-end border-t border-slate-100 pt-6 sm:grid-cols-[minmax(0,1fr)_auto]`}
        >
          <label className="block">
            <span className={dashboardLabelClass}>{Q.spotNameLabel}</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                spotType === "ROOM"
                  ? Q.spotPlaceholderRoom
                  : spotType === "SUNBED"
                    ? Q.spotPlaceholderSunbed
                    : Q.spotPlaceholderTable
              }
              maxLength={20}
              className={dashboardFieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null || !label.trim()}
            className={`inline-flex h-10 items-center gap-2 ${buttonClass("primary", "md")}`}
          >
            <Plus className="h-4 w-4" />
            {Q.addSpot}
          </button>
        </form>
      </div>

      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-navy">{Q.yourSpots(spots.length)}</h2>
          {loading ? <span className="text-xs text-slate-500">{Q.loadingSpots}</span> : null}
        </div>
        {spots.length === 0 && !loading ? (
          <p className="mt-6 text-center text-sm text-slate-500">{Q.emptySpots}</p>
        ) : (
          <div className="mt-4 space-y-5">
            {zoneGroups.map((zone) => (
              <section key={zone.id}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {zone.label}{" "}
                  <span className="font-semibold normal-case text-slate-400">
                    ({zone.spots.length})
                  </span>
                </h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {zone.spots.map((entry) => {
                    const spot = spotByKey.get(`${entry.spot.type}:${entry.spot.label}`);
                    if (!spot) return null;
                    return (
                      <li
                        key={spot.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                      >
                        {editingId === spot.id ? (
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              maxLength={20}
                              className={`${dashboardFieldClass} min-w-0 flex-1`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => void saveSpotLabel(spot.id)}
                              className={buttonClass("primary", "sm")}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className={buttonClass("secondary", "sm")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate text-sm font-medium text-brand-navy">
                              {formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
                            </span>
                            <div className="flex shrink-0 gap-1">
                              <DashboardIconButton
                                onClick={() => {
                                  setEditingId(spot.id);
                                  setEditLabel(spot.label);
                                }}
                                label={Q.editSpot}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </DashboardIconButton>
                              <DashboardIconButton
                                variant="danger"
                                onClick={() =>
                                  void removeSpot(
                                    spot.id,
                                    formatVenueSpotLabelForLang(spot.type, spot.label, lang),
                                  )
                                }
                                label={Q.deleteSpotLabel}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </DashboardIconButton>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className={dashboardCardClass}>
        <h2 className="font-semibold text-brand-navy">{S.tables.gridPreview}</h2>
        <p className="mt-2 text-sm text-slate-600">{S.tables.gridHint}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{S.tables.legendAutoNote}</p>
        <div className="mt-4">
          <TableGridLegend stateLabels={demo.tableStateLabels} />
        </div>
        {realTiles.length > 0 ? (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {S.tables.yourVenueSpots(venue?.name ?? "", spots.length)}
            </p>
            <TableGridPreview tiles={realTiles} stateLabels={demo.tableStateLabels} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
