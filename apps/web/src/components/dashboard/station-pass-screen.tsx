"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, MapPin } from "lucide-react";
import {
  findZoneIdForSpot,
  formatWaiterCallLocation,
  groupVenueSpotsByZone,
  pickDefaultZoneId,
  type PassStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScreenSpot = { type: VenueSpotType; label: string };

type ActiveSignal = {
  id: string;
  tableNumber: string | null;
  roomNumber: string | null;
  sunbedNumber: string | null;
  message: string | null;
  status: "READY" | "PICKED_UP";
  readyAt: string;
};

type ScreenContext = {
  venueId: string;
  venueName: string;
  venueSlug: string;
  station: PassStationInput;
  screenLabel?: string | null;
  spotPrefix?: string | null;
  spots: ScreenSpot[];
  activeSignals?: ActiveSignal[];
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
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι παραπάνω",
    quickComments: ["2 μουσακάς", "Χωριάτικη", "Σουβλάκια", "Ξέχασες τον πάγο"],
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
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι παραπάνω",
    quickComments: ["2 μπύρες", "Κρασί λευκό", "Φραπέ", "Χωρίς πάγο"],
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
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι παραπάνω",
    quickComments: ["Χωριάτικη", "Τζατζίκι", "Σαλάτα", "Πίτα"],
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
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι παραπάνω",
    quickComments: ["Παγωτό", "Μπακλαβάς", "Γαλακτομπούρεκο", "Με κουταλάκι"],
  },
};

export type StationScreenKind = keyof typeof COPY;

const EMPTY_SPOTS: ScreenSpot[] = [];
const POLL_MS = 8_000;

function spotSelected(selected: ScreenSpot | null, spot: ScreenSpot): boolean {
  return selected?.type === spot.type && selected.label === spot.label;
}

function signalToSpot(signal: ActiveSignal): ScreenSpot | null {
  if (signal.tableNumber) return { type: "TABLE", label: signal.tableNumber };
  if (signal.roomNumber) return { type: "ROOM", label: signal.roomNumber };
  if (signal.sunbedNumber) return { type: "SUNBED", label: signal.sunbedNumber };
  return null;
}

function minutesAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "τώρα";
  return `πριν ${mins} λεπ.`;
}

function playSendChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    void ctx.close();
  } catch {
    /* optional */
  }
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
    const params = new URLSearchParams({ venueSlug, key: stationKey, station });
    const res = await fetch(`/api/station-screen/context?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : C.invalid);
      setCtx(null);
      return;
    }
    setError(null);
    setCtx(data as ScreenContext);
  }, [venueSlug, stationKey, station, C.invalid]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const spots = useMemo(
    () => (ctx?.spots?.length ? ctx.spots : EMPTY_SPOTS),
    [ctx?.spots],
  );
  const activeSignals = ctx?.activeSignals ?? [];
  const zoneGroups = useMemo(() => groupVenueSpotsByZone(spots), [spots]);

  useEffect(() => {
    setActiveZoneId(pickDefaultZoneId(zoneGroups));
    setTable(null);
  }, [ctx?.venueId, zoneGroups]);

  const activeZone = zoneGroups.find((z) => z.id === activeZoneId) ?? zoneGroups[0];
  const visibleSpots = activeZone?.spots ?? [];
  const hasSelection = Boolean(table || manualTable.trim());

  function selectSpot(spot: ScreenSpot) {
    setTable(spot);
    setManualTable("");
    const zoneId = findZoneIdForSpot(zoneGroups, spot);
    if (zoneId) setActiveZoneId(zoneId);
  }

  function selectFromSignal(signal: ActiveSignal) {
    const spot = signalToSpot(signal);
    if (spot) selectSpot(spot);
    if (signal.message) setComment(signal.message);
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
      playSendChime();
      setFlash(C.sent);
      setComment("");
      setTable(null);
      setManualTable("");
      setTimeout(() => setFlash(null), 2500);
      void load();
    } finally {
      setSending(false);
    }
  }

  const selectedLabel = table
    ? formatWaiterCallLocation(
        table.type === "TABLE"
          ? { tableNumber: table.label }
          : table.type === "ROOM"
            ? { roomNumber: table.label }
            : { sunbedNumber: table.label },
      )
    : manualTable.trim()
      ? `Τραπέζι ${manualTable.trim()}`
      : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-900 text-white">
      <header className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">MenuOS</p>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">
          {ctx?.screenLabel ? `${C.title} · ${ctx.screenLabel}` : C.title}
        </h1>
        {ctx ? <p className="mt-1 text-sm text-slate-400 sm:text-base">{ctx.venueName}</p> : null}
      </header>

      {activeSignals.length > 0 ? (
        <section className="shrink-0 border-b border-white/10 bg-slate-950/60 px-4 py-3 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {C.waitingTitle} ({activeSignals.length})
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeSignals.map((signal) => {
              const spot = signalToSpot(signal);
              const location = formatWaiterCallLocation(signal);
              const picked = signal.status === "PICKED_UP";
              return (
                <button
                  key={signal.id}
                  type="button"
                  onClick={() => selectFromSignal(signal)}
                  className={cn(
                    "shrink-0 rounded-xl border px-3 py-2 text-left transition active:scale-[0.98]",
                    spot && table && spotSelected(table, spot)
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/15 bg-white/5 hover:border-white/25",
                  )}
                >
                  <p className="text-sm font-bold text-white">{location}</p>
                  {signal.message ? (
                    <p className="mt-0.5 max-w-[10rem] truncate text-xs text-slate-300">{signal.message}</p>
                  ) : null}
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[10px] font-medium",
                      picked ? "text-amber-300" : "text-emerald-300",
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {picked ? C.waitingPicked : C.waitingReady} · {minutesAgo(signal.readyAt)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        {ctx ? (
          <div className="mx-auto max-w-2xl space-y-4">
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
              </>
            ) : ctx.spotPrefix ? (
              <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                {C.emptyZone}
              </p>
            ) : (
              <input
                value={manualTable}
                onChange={(e) => {
                  setManualTable(e.target.value);
                  setTable(null);
                }}
                placeholder="12"
                maxLength={20}
                className="h-16 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-2xl font-bold text-white placeholder:text-slate-500"
              />
            )}
          </div>
        ) : !error ? (
          <p className="text-center text-slate-500">Φόρτωση…</p>
        ) : null}
      </main>

      {ctx ? (
        <footer className="shrink-0 border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto max-w-2xl space-y-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-3",
                hasSelection
                  ? "border-cyan-400/40 bg-cyan-500/10"
                  : "border-white/10 bg-white/5",
              )}
            >
              <MapPin className={cn("h-5 w-5 shrink-0", hasSelection ? "text-cyan-300" : "text-slate-500")} />
              <p className={cn("text-sm font-semibold", hasSelection ? "text-cyan-100" : "text-slate-400")}>
                {selectedLabel ?? C.noTable}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {C.quickComments.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setComment(chip)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    comment === chip
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-100"
                      : "border-white/15 bg-white/5 text-slate-300 hover:border-white/30",
                  )}
                >
                  {chip}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm text-slate-400">{C.comment}</span>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={C.commentPh}
                maxLength={80}
                className="mt-2 h-12 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-base text-white placeholder:text-slate-500"
              />
            </label>

            {flash ? (
              <p className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-center text-sm font-semibold text-emerald-200">
                {flash}
              </p>
            ) : null}

            <button
              type="button"
              disabled={sending || !hasSelection}
              onClick={() => void send()}
              className={cn(
                "h-16 w-full text-lg font-bold sm:h-[4.5rem] sm:text-xl",
                buttonClass("primary", "lg"),
                "rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50",
              )}
            >
              {sending ? "…" : C.send}
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
