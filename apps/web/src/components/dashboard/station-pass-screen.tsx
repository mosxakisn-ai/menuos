"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PassStationInput, VenueSpotType } from "@menuos/shared";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScreenSpot = { type: VenueSpotType; label: string };

type ScreenContext = {
  venueId: string;
  venueName: string;
  venueSlug: string;
  station: PassStationInput;
  spots: ScreenSpot[];
};

const COPY = {
  kitchen: {
    title: "Κουζίνα",
    send: "Έτοιμο στο πάσο",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. ξέχασες τον πάγο",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  bar: {
    title: "Μπαρ",
    send: "Έτοιμο το ποτό",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. χωρίς πάγο",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  cold: {
    title: "Κρύα κουζίνα",
    send: "Έτοιμο — κρύα",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. σαλάτα",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  dessert: {
    title: "Γλυκά",
    send: "Έτοιμο το γλυκό",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. με παγωτό",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    invalid: "Μη έγκυρο link οθόνης.",
  },
};

export type StationScreenKind = keyof typeof COPY;

export function StationPassScreen({ station }: { station: StationScreenKind }) {
  const searchParams = useSearchParams();
  const venueSlug = searchParams.get("venueSlug")?.trim() ?? "";
  const stationKey = searchParams.get("key")?.trim() ?? "";
  const C = COPY[station];

  const [ctx, setCtx] = useState<ScreenContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ScreenSpot | null>(null);
  const [manualTable, setManualTable] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!venueSlug || !stationKey) {
      setError(C.invalid);
      return;
    }
    setError(null);
    const params = new URLSearchParams({ venueSlug, key: stationKey, station });
    const res = await fetch(`/api/station-screen/context?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : C.invalid);
      setCtx(null);
      return;
    }
    setCtx(data as ScreenContext);
  }, [venueSlug, stationKey, station, C.invalid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const manual = manualTable.trim();
    if ((!table && !manual) || !ctx) return;
    setSending(true);
    setFlash(null);
    try {
      const location = table
        ? table.type === "TABLE"
          ? { tableNumber: table.label }
          : table.type === "ROOM"
            ? { roomNumber: table.label }
            : { sunbedNumber: table.label }
        : { tableNumber: manual };

      const res = await fetch("/api/pass-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: ctx.venueSlug,
          station,
          stationKey,
          ...location,
          message: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash(typeof data.error === "string" ? data.error : "Σφάλμα");
        return;
      }
      setFlash(C.sent);
      setComment("");
      setTable(null);
      setManualTable("");
      setTimeout(() => setFlash(null), 2500);
    } finally {
      setSending(false);
    }
  }

  const spots = ctx?.spots?.length ? ctx.spots : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-white/10 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">MenuOS</p>
        <h1 className="font-serif text-2xl font-bold">{C.title}</h1>
        {ctx ? <p className="mt-1 text-sm text-slate-400">{ctx.venueName}</p> : null}
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        {ctx ? (
          <>
            <p className="text-sm font-medium text-slate-300">{C.pickTable}</p>
            {spots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {spots.map((spot) => (
                  <button
                    key={`${spot.type}-${spot.label}`}
                    type="button"
                    onClick={() => setTable(spot)}
                    className={cn(
                      "aspect-square rounded-xl border-2 text-lg font-bold tabular-nums transition",
                      table?.type === spot.type && table.label === spot.label
                        ? "border-cyan-400 bg-cyan-500/20 text-white"
                        : "border-white/15 bg-white/5 text-slate-200 hover:border-white/30",
                    )}
                  >
                    {spot.label}
                  </button>
                ))}
              </div>
            ) : (
              <input
                value={manualTable}
                onChange={(e) => setManualTable(e.target.value)}
                placeholder="12"
                maxLength={20}
                className="h-14 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-xl font-bold text-white placeholder:text-slate-500"
              />
            )}

            <label className="block">
              <span className="text-sm text-slate-400">{C.comment}</span>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={C.commentPh}
                maxLength={80}
                className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-white placeholder:text-slate-500"
              />
            </label>

            {flash ? (
              <p className="rounded-xl bg-emerald-500/20 px-4 py-3 text-center text-sm font-semibold text-emerald-200">
                {flash}
              </p>
            ) : null}

            <button
              type="button"
              disabled={sending || (!table && !manualTable.trim())}
              onClick={() => void send()}
              className={cn(
                "h-16 w-full text-lg font-bold",
                buttonClass("primary", "lg"),
                "rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50",
              )}
            >
              {sending ? "…" : C.send}
            </button>
          </>
        ) : !error ? (
          <p className="text-center text-slate-500">Φόρτωση…</p>
        ) : null}
      </main>
    </div>
  );
}
