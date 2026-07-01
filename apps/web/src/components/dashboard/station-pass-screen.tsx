"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  findZoneIdForSpot,
  groupVenueSpotsByZone,
  pickDefaultZoneId,
  type PassStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScreenSpot = { type: VenueSpotType; label: string };

type ScreenContext = {
  venueId: string;
  venueName: string;
  venueSlug: string;
  station: PassStationInput;
  screenLabel?: string | null;
  spotPrefix?: string | null;
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
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  bar: {
    title: "Μπαρ",
    send: "Έτοιμο το ποτό",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. χωρίς πάγο",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  cold: {
    title: "Κρύα κουζίνα",
    send: "Έτοιμο — κρύα",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. σαλάτα",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
  },
  dessert: {
    title: "Γλυκά",
    send: "Έτοιμο το γλυκό",
    comment: "Σχόλιο (προαιρετικό)",
    commentPh: "π.χ. με παγωτό",
    sent: "Στάλθηκε στον σερβιτόρο!",
    pickTable: "Επίλεξε τραπέζι",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
  },
};

export type StationScreenKind = keyof typeof COPY;

const EMPTY_SPOTS: ScreenSpot[] = [];

function spotSelected(selected: ScreenSpot | null, spot: ScreenSpot): boolean {
  return selected?.type === spot.type && selected.label === spot.label;
}

export function StationPassScreen({ station }: { station: StationScreenKind }) {
  const searchParams = useSearchParams();
  const venueSlug = searchParams.get("venueSlug")?.trim() ?? "";
  const stationKey = searchParams.get("key")?.trim() ?? "";
  const C = COPY[station];

  const [ctx, setCtx] = useState<ScreenContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ScreenSpot | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
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

  const spots = useMemo(
    () => (ctx?.spots?.length ? ctx.spots : EMPTY_SPOTS),
    [ctx?.spots],
  );
  const zoneGroups = useMemo(() => groupVenueSpotsByZone(spots), [spots]);

  useEffect(() => {
    setActiveZoneId(pickDefaultZoneId(zoneGroups));
    setTable(null);
  }, [ctx?.venueId, zoneGroups]);

  const activeZone = zoneGroups.find((z) => z.id === activeZoneId) ?? zoneGroups[0];
  const visibleSpots = activeZone?.spots ?? [];

  function selectSpot(spot: ScreenSpot) {
    setTable(spot);
    const zoneId = findZoneIdForSpot(zoneGroups, spot);
    if (zoneId) setActiveZoneId(zoneId);
  }

  function selectZone(zoneId: string) {
    setActiveZoneId(zoneId);
    if (table && findZoneIdForSpot(zoneGroups, table) !== zoneId) {
      setTable(null);
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-white/10 px-4 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">MenuOS</p>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">
          {ctx?.screenLabel ? `${C.title} · ${ctx.screenLabel}` : C.title}
        </h1>
        {ctx ? <p className="mt-1 text-sm text-slate-400 sm:text-base">{ctx.venueName}</p> : null}
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        {ctx ? (
          <>
            <p className="text-base font-medium text-slate-300">{C.pickTable}</p>

            {spots.length > 0 ? (
              <>
                {zoneGroups.length > 1 ? (
                  <div
                    className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="tablist"
                    aria-label="Ζώνες"
                  >
                    {zoneGroups.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        role="tab"
                        aria-selected={activeZone?.id === zone.id}
                        onClick={() => selectZone(zone.id)}
                        className={cn(
                          "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                          activeZone?.id === zone.id
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-white/10 text-slate-300 hover:bg-white/15",
                        )}
                      >
                        {zone.label}
                        <span className="ml-1.5 text-xs font-normal opacity-80">({zone.spots.length})</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {visibleSpots.map(({ spot, displayLabel }) => {
                    const selected = spotSelected(table, spot);
                    return (
                      <button
                        key={`${spot.type}-${spot.label}`}
                        type="button"
                        onClick={() => selectSpot(spot)}
                        className={cn(
                          "flex min-h-[5.25rem] flex-col items-center justify-center rounded-2xl border-2 px-2 py-3 transition sm:min-h-[6rem]",
                          selected
                            ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                            : "border-white/15 bg-white/5 text-slate-100 hover:border-white/30 active:scale-[0.98]",
                        )}
                      >
                        <span className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">
                          {displayLabel}
                        </span>
                        {zoneGroups.length <= 1 && spot.label !== displayLabel ? (
                          <span className="mt-1 max-w-full truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            {spot.label}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {table ? (
                  <p className="text-center text-sm text-cyan-300/90">
                    Επιλογή: <span className="font-semibold text-cyan-200">{table.label}</span>
                  </p>
                ) : null}
              </>
            ) : ctx.spotPrefix ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                {C.emptyZone}
              </p>
            ) : (
              <input
                value={manualTable}
                onChange={(e) => setManualTable(e.target.value)}
                placeholder="12"
                maxLength={20}
                className="h-16 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-2xl font-bold text-white placeholder:text-slate-500"
              />
            )}

            <label className="block">
              <span className="text-sm text-slate-400">{C.comment}</span>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={C.commentPh}
                maxLength={80}
                className="mt-2 h-14 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-lg text-white placeholder:text-slate-500"
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
                "h-16 w-full text-lg font-bold sm:h-[4.5rem] sm:text-xl",
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
