"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Monitor, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import type { PassStationInput } from "@menuos/shared";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { clientShareOrigin } from "@/lib/client-share-origin";
import { stationScreenPath, type StationScreenRow } from "@/lib/station-screens";
import { cn } from "@/lib/utils";

type Venue = { id: string; name: string; slug: string };

function buildScreenUrl(station: PassStationInput, slug: string, token: string) {
  const u = new URL(stationScreenPath(station), clientShareOrigin());
  u.searchParams.set("venueSlug", slug);
  u.searchParams.set("key", token);
  return u.toString();
}

function stationCopy(
  station: PassStationInput,
  S: ReturnType<typeof useDashboardCopy>["d"]["pages"]["settings"],
) {
  return station === "kitchen"
    ? S.kitchen
    : station === "bar"
      ? S.bar
      : station === "cold"
        ? S.cold
        : S.dessert;
}

export function StationScreensPanel({
  station,
  venues,
  venueId: controlledVenueId,
  embedded = false,
}: {
  station: PassStationInput;
  venues: Venue[];
  venueId?: string;
  embedded?: boolean;
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const copy = stationCopy(station, S);

  const [internalVenueId, setInternalVenueId] = useState(venues[0]?.id ?? "");
  const venueId = controlledVenueId ?? internalVenueId;
  const [screens, setScreens] = useState<StationScreenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSpotPrefix, setNewSpotPrefix] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSpotPrefix, setEditSpotPrefix] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedUrlId, setExpandedUrlId] = useState<string | null>(null);

  const venue = venues.find((v) => v.id === venueId);

  const loadScreens = useCallback(async () => {
    if (!venueId) {
      setScreens([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/station-screens?station=${station}`);
      const data = (await res.json()) as { screens?: StationScreenRow[] };
      setScreens(res.ok ? (data.screens ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, [venueId, station]);

  useEffect(() => {
    if (controlledVenueId) return;
    if (venues.length && !venues.some((v) => v.id === internalVenueId)) {
      setInternalVenueId(venues[0]!.id);
    }
  }, [venues, internalVenueId, controlledVenueId]);

  useEffect(() => {
    void loadScreens();
  }, [loadScreens]);

  async function copyLink(screen: StationScreenRow) {
    if (!venue) return;
    const url = buildScreenUrl(station, venue.slug, screen.screenToken);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setCopiedId(screen.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function addScreen() {
    if (!venueId || !newLabel.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/station-screens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station,
          label: newLabel.trim(),
          spotPrefix: newSpotPrefix.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : S.addScreenFailed);
        return;
      }
      setNewLabel("");
      setNewSpotPrefix("");
      await loadScreens();
    } finally {
      setAdding(false);
    }
  }

  async function rotateScreen(screenId: string) {
    if (!window.confirm(S.rotateScreenConfirm)) return;
    setBusyId(screenId);
    try {
      const res = await fetch(`/api/venues/${venueId}/station-screens/${screenId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : S.rotateScreenFailed);
        return;
      }
      await loadScreens();
    } finally {
      setBusyId(null);
    }
  }

  async function deleteScreen(screen: StationScreenRow) {
    if (!window.confirm(S.deleteScreenConfirm(screen.label))) return;
    setBusyId(screen.id);
    try {
      const res = await fetch(`/api/venues/${venueId}/station-screens/${screen.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : S.deleteScreenFailed);
        return;
      }
      if (editingId === screen.id) {
        setEditingId(null);
        setEditLabel("");
      }
      await loadScreens();
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(screen: StationScreenRow) {
    setEditingId(screen.id);
    setEditLabel(screen.label);
    setEditSpotPrefix(screen.spotPrefix ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditSpotPrefix("");
  }

  async function saveEdit(screenId: string) {
    const label = editLabel.trim();
    if (!label) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/station-screens/${screenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          spotPrefix: editSpotPrefix.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : S.renameScreenFailed);
        return;
      }
      setEditingId(null);
      setEditLabel("");
      setEditSpotPrefix("");
      await loadScreens();
    } finally {
      setSavingEdit(false);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-sm text-slate-600">{d.pages.qr.needVenueDesc}</p>
      </div>
    );
  }

  const shellClass = embedded
    ? "rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    : dashboardCardClass;

  return (
    <section className={shellClass}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <Monitor className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-brand-navy">{copy.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{copy.description}</p>
        </div>
      </div>

      {!controlledVenueId && venues.length > 1 ? (
        <label className="mt-4 block max-w-md">
          <span className={dashboardLabelClass}>{d.venue}</span>
          <select
            value={internalVenueId}
            onChange={(e) => setInternalVenueId(e.target.value)}
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

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">{S.loadingScreens}</p>
        ) : screens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            {S.screensEmpty}
          </p>
        ) : (
          screens.map((screen) => {
            const url = venue ? buildScreenUrl(station, venue.slug, screen.screenToken) : "";
            const busy = busyId === screen.id;
            const editing = editingId === screen.id;
            const showUrl = expandedUrlId === screen.id;

            return (
              <div
                key={screen.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
              >
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className={dashboardLabelClass}>{S.screenNameLabel}</span>
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          maxLength={40}
                          className={dashboardFieldClass}
                          autoFocus
                        />
                      </label>
                      <label className="block">
                        <span className={dashboardLabelClass}>{S.screenSpotPrefixLabel}</span>
                        <input
                          value={editSpotPrefix}
                          onChange={(e) => setEditSpotPrefix(e.target.value)}
                          placeholder={S.screenSpotPrefixPlaceholder}
                          maxLength={20}
                          className={dashboardFieldClass}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">{S.screenSpotPrefixHintShort}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingEdit || !editLabel.trim()}
                        onClick={() => void saveEdit(screen.id)}
                        className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {savingEdit ? S.savingScreen : S.saveScreen}
                      </button>
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={cancelEdit}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <X className="h-3.5 w-3.5" />
                        {S.cancelScreenEdit}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-brand-navy">{screen.label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {screen.spotPrefix
                            ? S.screenSpotPrefixActive(screen.spotPrefix)
                            : S.allTablesZone}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(screen)}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {S.renameScreen}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!url}
                        className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")} ${!url ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {copy.openScreen}
                      </a>
                      <button
                        type="button"
                        disabled={!url}
                        onClick={() => void copyLink(screen)}
                        className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                      >
                        {copiedId === screen.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiedId === screen.id ? d.waiter.copied : copy.copyScreenLink}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void rotateScreen(screen.id)}
                        className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                        {busy ? S.rotatingScreen : S.rotateScreenButton}
                      </button>
                      {screens.length > 1 ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteScreen(screen)}
                          className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")} text-red-700`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {S.deleteScreen}
                        </button>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedUrlId(showUrl ? null : screen.id)}
                      className="mt-2 text-xs font-medium text-brand-blue hover:underline"
                    >
                      {showUrl ? S.hideLink : S.showLink}
                    </button>
                    {showUrl ? (
                      <code className="mt-2 block break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        {url || "…"}
                      </code>
                    ) : null}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        className={cn(
          "mt-5 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4",
          embedded && "bg-slate-50/40",
        )}
      >
        <p className="text-sm font-semibold text-brand-navy">{S.addScreenFor(copy.title)}</p>
        <p className="mt-1 text-xs text-slate-500">{S.addScreenHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={dashboardLabelClass}>{S.screenNameLabel}</span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={S.screenNamePlaceholder}
              maxLength={40}
              className={dashboardFieldClass}
            />
          </label>
          <label className="block">
            <span className={dashboardLabelClass}>{S.screenSpotPrefixLabel}</span>
            <input
              value={newSpotPrefix}
              onChange={(e) => setNewSpotPrefix(e.target.value)}
              placeholder={S.screenSpotPrefixPlaceholder}
              maxLength={20}
              className={dashboardFieldClass}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-500">{S.screenSpotPrefixHintShort}</p>
        <button
          type="button"
          disabled={adding || !newLabel.trim()}
          onClick={() => void addScreen()}
          className={`mt-3 inline-flex items-center gap-1.5 ${buttonClass("secondary", "md")}`}
        >
          <Plus className="h-4 w-4" />
          {adding ? S.addingScreen : S.addScreenButton}
        </button>
      </div>
    </section>
  );
}
