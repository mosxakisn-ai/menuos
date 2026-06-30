"use client";

import { Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  formatVenueSpotLabel,
  spotToQueryParams,
  venueSpotTypeLabel,
  type VenueSpotType,
  VENUE_SPOT_TYPES,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

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
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [spotType, setSpotType] = useState<VenueSpotType>("TABLE");
  const [label, setLabel] = useState("");
  const [bulkFrom, setBulkFrom] = useState("1");
  const [bulkTo, setBulkTo] = useState("50");
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
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    setBusy("bulk");
    try {
      const res = await fetch(`/api/venues/${venueId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: spotType, from, to }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) await loadSpots();
    } finally {
      setBusy(null);
    }
  }

  async function removeSpot(spotId: string) {
    if (!venueId) return;
    setBusy(spotId);
    try {
      const res = await fetch(`/api/venues/${venueId}/spots/${spotId}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) await loadSpots();
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
      <Card>
        <p className="font-semibold text-brand-navy">Χρειάζεσαι πρώτα κατάστημα</p>
        <p className="mt-2 text-sm text-slate-600">Φτιάξε κατάστημα και πρόσθεσε πιάτα πριν βγάλεις QR.</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {DASHBOARD_EL.addVenue}
        </a>
      </Card>
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
          <p className="font-semibold">Ο κατάλογος είναι άδειος</p>
          <p className="mt-1">
            Πρόσθεσε πιάτα στον{" "}
            <a href={`/dashboard/menus?venue=${venueId}`} className="font-semibold underline">
              κατάλογο
            </a>{" "}
            πριν μοιράσεις QR.
          </p>
        </div>
      ) : null}

      <Card>
        <h2 className="font-semibold text-brand-navy">Τραπέζια, δωμάτια & ξαπλώστρες</h2>
        <p className="mt-1 text-sm text-slate-600">
          Πρόσθεσε κάθε θέση μία φορά. Κάθε QR «δένει» τον αριθμό — ο σερβιτόρος βλέπει ακριβώς από πού καλούν.
        </p>

        <label className="mt-4 block text-sm">
          <span className="font-medium">{DASHBOARD_EL.venue}</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1 w-full max-w-md rounded-button border border-slate-200 px-3 py-2.5"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={addSpot} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="font-medium">Τύπος</span>
            <select
              value={spotType}
              onChange={(e) => setSpotType(e.target.value as VenueSpotType)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            >
              {VENUE_SPOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {venueSpotTypeLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">Αριθμός / όνομα</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={spotType === "ROOM" ? "204" : spotType === "SUNBED" ? "A12" : "12"}
              maxLength={20}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy !== null || !label.trim()}
              className={`inline-flex w-full items-center justify-center gap-2 ${buttonClass("primary")}`}
            >
              <Plus className="h-4 w-4" />
              Προσθήκη
            </button>
          </div>
        </form>

        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-medium text-brand-navy">Μαζική προσθήκη (π.χ. τραπέζια 1–50)</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="text-slate-600">Από</span>
              <input
                type="number"
                min={1}
                max={999}
                value={bulkFrom}
                onChange={(e) => setBulkFrom(e.target.value)}
                className="mt-1 block w-24 rounded-button border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">Έως</span>
              <input
                type="number"
                min={1}
                max={999}
                value={bulkTo}
                onChange={(e) => setBulkTo(e.target.value)}
                className="mt-1 block w-24 rounded-button border border-slate-200 px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void bulkAdd()}
              className={buttonClass("secondary", "sm")}
            >
              {busy === "bulk" ? "Προσθήκη..." : "Προσθήκη όλων"}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-brand-navy">
            Οι θέσεις σου {spots.length > 0 ? `(${spots.length})` : ""}
          </h2>
          {loadingSpots ? <span className="text-xs text-slate-500">Φόρτωση...</span> : null}
        </div>

        {spots.length === 0 && !loadingSpots ? (
          <p className="mt-4 text-sm text-slate-500">
            Δεν έχεις ακόμα θέσεις. Πρόσθεσε τραπέζι 12 ή κάνε μαζική προσθήκη 1–50.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {spots.map((spot) => (
              <li key={spot.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <p className="font-medium text-brand-navy">{formatVenueSpotLabel(spot.type, spot.label)}</p>
                  <p className="mt-0.5 break-all text-xs text-slate-500">{menuPathFor(spot)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
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
                    Preview
                  </a>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void removeSpot(spot.id)}
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                    aria-label="Διαγραφή"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
