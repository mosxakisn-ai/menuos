"use client";

import { Check, Download, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  formatVenueSpotLabelForLang,
  isValidVenueSpotLabel,
  spotToQueryParams,
  type VenueSpotType,
  VENUE_SPOT_TYPES,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  DashboardSectionTitle,
  DashboardToolbar,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

type Venue = { id: string; name: string; slug: string };
type Spot = { id: string; type: VenueSpotType; label: string };

export function VenueSpotsManager({
  venues,
  initialVenueId,
  itemCountByVenue = {},
}: {
  venues: Venue[];
  initialVenueId?: string;
  itemCountByVenue?: Record<string, number>;
}) {
  const { d, lang } = useDashboardCopy();
  const Q = d.pages.qr;
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [spotType, setSpotType] = useState<VenueSpotType>("TABLE");
  const [label, setLabel] = useState("");
  const [bulkFrom, setBulkFrom] = useState("1");
  const [bulkTo, setBulkTo] = useState("");
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const venue = venues.find((v) => v.id === venueId);
  const itemCount = itemCountByVenue[venueId] ?? 0;

  const loadSpots = useCallback(async () => {
    if (!venueId) return;
    setLoadingSpots(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`);
      const data = await res.json();
      if (res.ok) setSpots(data.spots ?? []);
      else setSpots([]);
    } finally {
      setLoadingSpots(false);
    }
  }, [venueId]);

  useEffect(() => {
    void loadSpots();
  }, [loadSpots]);

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
      showFromResponse(data, res.ok);
      if (res.ok) {
        setLabel("");
        await loadSpots();
      }
    } finally {
      setBusy(null);
    }
  }

  async function bulkAdd() {
    if (!venueId) return;
    const from = Number(bulkFrom);
    const to = Number(bulkTo);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || from < 1 || to > 999) {
      setFlash({ type: "error", text: Q.invalidRange });
      return;
    }
    if (to - from >= 200) {
      setFlash({
        type: "error",
        text: Q.bulkLimit,
      });
      return;
    }
    const prefix = bulkPrefix.trim();
    if (prefix && !isValidVenueSpotLabel(`${prefix}1`)) {
      setFlash({ type: "error", text: Q.invalidPrefix(Q.labelHint) });
      return;
    }
    setBusy("bulk");
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: spotType,
          from,
          to,
          prefix: bulkPrefix.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) await loadSpots();
    } finally {
      setBusy(null);
    }
  }

  async function removeSpot(spot: Spot) {
    if (!venueId) return;
    const name = formatVenueSpotLabelForLang(spot.type, spot.label, lang);
    if (!window.confirm(Q.deleteSpotConfirm(name))) {
      return;
    }
    setBusy(spot.id);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spot.id}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        if (editingId === spot.id) {
          setEditingId(null);
          setEditLabel("");
        }
        await loadSpots();
      }
    } finally {
      setBusy(null);
    }
  }

  function startEditing(spot: Spot) {
    setEditingId(spot.id);
    setEditLabel(spot.label);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditLabel("");
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
      showFromResponse(data, res.ok);
      if (res.ok) {
        cancelEditing();
        await loadSpots();
      }
    } finally {
      setBusy(null);
    }
  }

  async function downloadQr(spot: Spot) {
    if (!venueId) return;
    setBusy(`qr-${spot.id}`);
    try {
      const params = new URLSearchParams({ venueId });
      const q = spotToQueryParams(spot.type, spot.label);
      if (q.table) params.set("table", q.table);
      if (q.room) params.set("room", q.room);
      if (q.sunbed) params.set("sunbed", q.sunbed);
      const res = await fetch(`/api/qr?${params}`);
      const data = await res.json();
      if (!res.ok) {
        showFromResponse(data, false);
        return;
      }
      const a = document.createElement("a");
      a.href = data.pngDataUrl;
      a.download = `menuos-${spot.type.toLowerCase()}-${spot.label}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  function menuPathFor(spot: Spot): string {
    if (!venue) return "#";
    const params = new URLSearchParams();
    const q = spotToQueryParams(spot.type, spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    const qs = params.toString();
    return `/m/${venue.slug}${qs ? `?${qs}` : ""}`;
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

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {itemCount === 0 ? (
        <div
          role="alert"
          className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">{Q.emptyCatalogTitle}</p>
          <p className="mt-1">
            {Q.emptyCatalogBeforeLink}{" "}
            <a href={`/dashboard/menus?venue=${venueId}`} className="font-semibold underline">
              {Q.catalogLink}
            </a>{" "}
            {Q.emptyCatalogAfterLink}
          </p>
        </div>
      ) : null}

      <div className={dashboardCardClass}>
        <DashboardSectionTitle
          title={Q.spotsTitle}
          description={Q.spotsDesc}
        />

        <DashboardToolbar className="mt-6">
          <label className="block min-w-[12rem] flex-1 sm:max-w-md">
            <span className={dashboardLabelClass}>{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => {
                setVenueId(e.target.value);
                cancelEditing();
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

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-brand-navy">{Q.bulkTitle}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{Q.bulkDesc}</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="block">
              <span className={dashboardLabelClass}>{Q.prefixLabel}</span>
              <input
                type="text"
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.spotPrefix}
                maxLength={15}
                className={`${dashboardFieldClass} w-32`}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>{Q.fromLabel}</span>
              <input
                type="number"
                min={1}
                max={999}
                value={bulkFrom}
                onChange={(e) => setBulkFrom(e.target.value)}
                placeholder={FORM_PLACEHOLDERS.spotBulkFrom}
                className={`${dashboardFieldClass} w-24`}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>{Q.toLabel}</span>
              <input
                type="number"
                min={1}
                max={999}
                placeholder={FORM_PLACEHOLDERS.spotBulkTo}
                value={bulkTo}
                onChange={(e) => setBulkTo(e.target.value)}
                className={`${dashboardFieldClass} w-24`}
              />
            </label>
            <button
              type="button"
              disabled={busy !== null || !bulkTo.trim()}
              onClick={() => void bulkAdd()}
              className={`h-10 ${buttonClass("secondary", "md")}`}
            >
              {busy === "bulk" ? Q.bulkAdding : Q.bulkAddAll}
            </button>
          </div>
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
            className={`inline-flex h-10 w-full items-center justify-center gap-2 sm:w-auto sm:min-w-[9.5rem] ${buttonClass("primary", "md")}`}
          >
            <Plus className="h-4 w-4" />
            {Q.addSpot}
          </button>
        </form>
      </div>

      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-navy">{Q.yourSpots(spots.length)}</h2>
          {loadingSpots ? <span className="text-xs text-slate-500">{Q.loadingSpots}</span> : null}
        </div>

        {spots.length === 0 && !loadingSpots ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
            {Q.emptySpots}
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {spots.map((spot) => (
              <li
                key={spot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  {editingId === spot.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={20}
                        className={`${dashboardFieldClass} max-w-xs`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveSpotLabel(spot.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy !== null || !editLabel.trim()}
                        onClick={() => void saveSpotLabel(spot.id)}
                        className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {Q.saveSpot}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={cancelEditing}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <X className="h-3.5 w-3.5" />
                        {Q.cancelEdit}
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-brand-navy">
                      {formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
                    </p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-slate-500">{menuPathFor(spot)}</p>
                  {editingId === spot.id ? (
                    <p className="mt-1 text-xs text-amber-700">{Q.renameQrWarning}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {editingId !== spot.id ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => startEditing(spot)}
                      className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {Q.editSpot}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void downloadQr(spot)}
                    className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    QR
                  </button>
                  <a
                    href={menuPathFor(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {Q.previewSpot}
                  </a>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void removeSpot(spot)}
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                    aria-label={Q.deleteSpotLabel}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
