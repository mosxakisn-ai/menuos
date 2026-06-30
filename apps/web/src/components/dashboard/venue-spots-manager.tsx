"use client";

import { Check, Download, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  formatVenueSpotLabel,
  spotToQueryParams,
  venueSpotTypeLabel,
  type VenueSpotType,
  VENUE_SPOT_TYPES,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  DashboardSectionTitle,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
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
      setFlash({ type: "error", text: "Βάλε έγκυρο εύρος από 1 έως 999 (π.χ. από 1 έως 120)." });
      return;
    }
    if (to - from >= 200) {
      setFlash({
        type: "error",
        text: "Μέγιστο 200 θέσεις ανά φορά. Για περισσότερες, κάνε δεύτερη προσθήκη (π.χ. 201–400).",
      });
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
    const name = formatVenueSpotLabel(spot.type, spot.label);
    if (
      !window.confirm(
        `Διαγραφή της θέσης «${name}»;\n\nΑν έχεις ήδη τυπώσει QR, δεν θα λειτουργεί πλέον. Η ενέργεια δεν αναιρείται.`,
      )
    ) {
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

      <Card className="p-6 sm:p-8">
        <DashboardSectionTitle
          title="Τραπέζια, δωμάτια & ξαπλώστρες"
          description="Πρόσθεσε κάθε θέση μία φορά. Κάθε QR «δένει» τον αριθμό — ο σερβιτόρος βλέπει ακριβώς από πού καλούν."
        />

        <label className="mt-6 block max-w-md">
          <span className={dashboardLabelClass}>{DASHBOARD_EL.venue}</span>
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

        <label className="mt-6 block max-w-xs">
          <span className={dashboardLabelClass}>Τύπος</span>
          <select
            value={spotType}
            onChange={(e) => setSpotType(e.target.value as VenueSpotType)}
            className={dashboardFieldClass}
          >
            {VENUE_SPOT_TYPES.map((t) => (
              <option key={t} value={t}>
                {venueSpotTypeLabel(t)}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-brand-navy">Μαζική προσθήκη</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Όσα τραπέζια, δωμάτια ή ξαπλώστρες χρειάζεσαι — χωρίς όριο πλάνου. Έως 200 θέσεις κάθε φορά
            (για περισσότερες, επανάλαβε με νέο εύρος). Προαιρετικό πρόθεμα για ζώνες (π.χ.{" "}
            <span className="font-medium text-slate-700">sala-</span>,{" "}
            <span className="font-medium text-slate-700">kipos-</span>).
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <label className="block">
              <span className={dashboardLabelClass}>Πρόθεμα (προαιρετικό)</span>
              <input
                type="text"
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value)}
                placeholder="sala-"
                maxLength={15}
                className={`${dashboardFieldClass} w-32`}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>Από</span>
              <input
                type="number"
                min={1}
                max={999}
                value={bulkFrom}
                onChange={(e) => setBulkFrom(e.target.value)}
                className={`${dashboardFieldClass} w-24`}
              />
            </label>
            <label className="block">
              <span className={dashboardLabelClass}>Έως</span>
              <input
                type="number"
                min={1}
                max={999}
                placeholder="120"
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
              {busy === "bulk" ? "Προσθήκη..." : "Προσθήκη όλων"}
            </button>
          </div>
        </div>

        <form
          onSubmit={addSpot}
          className="mt-6 grid items-end gap-4 border-t border-slate-100 pt-6 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <label className="block">
            <span className={dashboardLabelClass}>Αριθμός / όνομα</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                spotType === "ROOM" ? "204 ή vip-1" : spotType === "SUNBED" ? "A12 ή paralia-3" : "12 ή sala-1"
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
            Προσθήκη
          </button>
        </form>
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-brand-navy">
            Οι θέσεις σου {spots.length > 0 ? `(${spots.length})` : ""}
          </h2>
          {loadingSpots ? <span className="text-xs text-slate-500">Φόρτωση...</span> : null}
        </div>

        {spots.length === 0 && !loadingSpots ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
            Δεν έχεις ακόμα θέσεις. Πρόσθεσε μία θέση ή κάνε μαζική προσθήκη (π.χ. 1–120).
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
                        Αποθήκευση
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={cancelEditing}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                      >
                        <X className="h-3.5 w-3.5" />
                        Άκυρο
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-brand-navy">{formatVenueSpotLabel(spot.type, spot.label)}</p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-slate-500">{menuPathFor(spot)}</p>
                  {editingId === spot.id ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Αλλάζοντας το όνομα, αλλάζει και το URL του QR — ξανατύπωσε QR αν χρειάζεται.
                    </p>
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
                      Επεξεργασία
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
                    Preview
                  </a>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void removeSpot(spot)}
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
