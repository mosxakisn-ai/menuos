"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { PassStationInput } from "@menuos/shared";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { clientShareOrigin } from "@/lib/client-share-origin";
import { stationScreenPath, type StationScreenRow } from "@/lib/station-screens";

type Venue = { id: string; name: string; slug: string };

function buildScreenUrl(station: PassStationInput, slug: string, token: string) {
  const u = new URL(stationScreenPath(station), clientShareOrigin());
  u.searchParams.set("venueSlug", slug);
  u.searchParams.set("key", token);
  return u.toString();
}

export function StationScreensPanel({
  station,
  venues,
}: {
  station: PassStationInput;
  venues: Venue[];
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const copy =
    station === "kitchen"
      ? S.kitchen
      : station === "bar"
        ? S.bar
        : station === "cold"
          ? S.cold
          : S.dessert;

  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [screens, setScreens] = useState<StationScreenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    if (venues.length && !venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

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
        body: JSON.stringify({ station, label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : S.addScreenFailed);
        return;
      }
      setNewLabel("");
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
      await loadScreens();
    } finally {
      setBusyId(null);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-sm text-slate-600">{d.pages.qr.needVenueDesc}</p>
      </div>
    );
  }

  return (
    <div className={dashboardCardClass}>
      <h2 className="text-sm font-semibold text-primary">{copy.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{copy.description}</p>
      <p className="mt-2 text-xs text-slate-500">{S.multiScreenHint}</p>

      {venues.length > 1 ? (
        <label className="mt-4 block max-w-md">
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

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">{S.loadingScreens}</p>
        ) : (
          screens.map((screen) => {
            const url = venue ? buildScreenUrl(station, venue.slug, screen.screenToken) : "";
            const busy = busyId === screen.id;
            return (
              <div
                key={screen.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4"
              >
                <p className="font-semibold text-brand-navy">{screen.label}</p>
                <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
                  {url || "…"}
                </code>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!url}
                    className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")} ${!url ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {copy.openScreen}
                  </a>
                  <button
                    type="button"
                    disabled={!url}
                    onClick={() => void copyLink(screen)}
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
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
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
                    {busy ? S.rotatingScreen : S.rotateScreenButton}
                  </button>
                  {screens.length > 1 ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteScreen(screen)}
                      className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")} text-red-700`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {S.deleteScreen}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
        <p className="text-sm font-semibold text-brand-navy">{S.addScreenTitle}</p>
        <p className="mt-1 text-xs text-slate-500">{S.addScreenHint}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block min-w-[200px] flex-1">
            <span className={dashboardLabelClass}>{S.screenNameLabel}</span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={S.screenNamePlaceholder}
              maxLength={40}
              className={dashboardFieldClass}
            />
          </label>
          <button
            type="button"
            disabled={adding || !newLabel.trim()}
            onClick={() => void addScreen()}
            className={`inline-flex items-center gap-1 ${buttonClass("secondary", "md")}`}
          >
            <Plus className="h-4 w-4" />
            {adding ? S.addingScreen : S.addScreenButton}
          </button>
        </div>
      </div>
    </div>
  );
}
