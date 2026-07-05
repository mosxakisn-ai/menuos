"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, MapPin, X } from "lucide-react";
import {
  findZoneIdForSpot,
  formatWaiterCallLocation,
  groupVenueSpotsByZone,
  pickDefaultZoneId,
  type PassStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { buttonClass } from "@/components/ui/button";
import { confirmDestructive } from "@/lib/confirm-action";
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
  stationLabel?: string;
  screenLabel?: string | null;
  spotPrefix?: string | null;
  quickComments?: string[];
  spots: ScreenSpot[];
  activeSignals?: ActiveSignal[];
  todayCount?: number;
};

const COPY = {
  kitchen: {
    title: "Κουζίνα",
    send: "Αποστολή",
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
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    quickComments: ["Ξέχασες τον πάγο", "Ξέχασες το ψωμί", "2 πιάτα μαζί", "Επείγον"],
  },
  bar: {
    title: "Μπαρ",
    send: "Αποστολή",
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
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    quickComments: ["Χωρίς πάγο", "Με πάγο", "Ξέχασες καλαμάκι", "Επείγον"],
  },
  cold: {
    title: "Κρύα κουζίνα",
    send: "Αποστολή",
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
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    quickComments: ["Με σως χωριστά", "Χωρίς κρεμμύδι", "Ξέχασες πίτα", "Επείγον"],
  },
  dessert: {
    title: "Γλυκά",
    send: "Αποστολή",
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
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    quickComments: ["Με παγωτό", "Χωρίς ζάχαρη", "Ξέχασες κουταλάκι", "Επείγον"],
  },
};

export type StationScreenKind = keyof typeof COPY;

const EMPTY_SPOTS: ScreenSpot[] = [];
const POLL_MS = 8_000;
const QUICK_MESSAGE_ROW_PX = 56;
const QUICK_MESSAGES_MAX_HEIGHT_PX = QUICK_MESSAGE_ROW_PX * 4 + 8;

function QuickMessagesPanel({
  title,
  messages,
  selectedMessage,
  disabled,
  onSelect,
}: {
  title: string;
  messages: string[];
  selectedMessage?: string | null;
  disabled: boolean;
  onSelect: (message: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      setHasOverflow(false);
      return;
    }
    const overflow = el.scrollHeight > el.clientHeight + 4;
    setHasOverflow(overflow);
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages, updateScrollState]);

  function scrollMessages(direction: "up" | "down") {
    listRef.current?.scrollBy({
      top: direction === "up" ? -QUICK_MESSAGE_ROW_PX * 2 : QUICK_MESSAGE_ROW_PX * 2,
      behavior: "smooth",
    });
    window.setTimeout(updateScrollState, 320);
  }

  if (messages.length === 0) return null;

  const showArrows = hasOverflow || messages.length > 4;

  return (
    <div className="mt-4 flex justify-end">
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-col items-stretch gap-2">
          <p className="text-right text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <div
            ref={listRef}
            onScroll={updateScrollState}
            className="flex w-[11.5rem] flex-col gap-2 overflow-y-auto scroll-smooth sm:w-[13rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: QUICK_MESSAGES_MAX_HEIGHT_PX }}
          >
            {messages.map((chip, index) => {
              const selected = selectedMessage?.trim() === chip;
              return (
              <button
                key={`${index}-${chip}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(chip)}
                className={cn(
                  "min-h-[3.25rem] shrink-0 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold leading-snug transition active:scale-[0.98] disabled:opacity-40",
                  selected
                    ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                    : "border-white/20 bg-white/10 text-slate-100 hover:border-cyan-400/50 hover:bg-cyan-500/15",
                )}
              >
                {chip}
              </button>
            );
            })}
          </div>
        </div>
        {showArrows ? (
          <div className="flex flex-col justify-end gap-2 pb-0.5">
            <button
              type="button"
              aria-label="Προηγούμενα μηνύματα"
              disabled={!canScrollUp}
              onClick={() => scrollMessages("up")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-30"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Επόμενα μηνύματα"
              disabled={!canScrollDown}
              onClick={() => scrollMessages("down")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-30"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

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

function useScreenWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    async function acquire() {
      try {
        if (document.visibilityState !== "visible") return;
        lockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        /* tablet may deny until user gesture */
      }
    }

    void acquire();
    const onVisible = () => void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);

  useScreenWakeLock();

  const quickComments =
    ctx?.quickComments?.length ? ctx.quickComments : C.quickComments;
  const displayStationTitle = ctx?.stationLabel?.trim() || C.title;

  const load = useCallback(async () => {
    if (!venueSlug || !stationKey) {
      setError(C.invalid);
      return;
    }
    const generation = ++loadGenerationRef.current;
    const params = new URLSearchParams({ venueSlug, key: stationKey, station });
    const res = await fetch(`/api/station-screen/context?${params}`);
    const data = await res.json();
    if (generation !== loadGenerationRef.current) return;
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
  const spotsLayoutKey = useMemo(
    () => spots.map((s) => `${s.type}:${s.label}`).join("|"),
    [spots],
  );
  const activeSignals = ctx?.activeSignals ?? [];
  const zoneGroups = useMemo(() => groupVenueSpotsByZone(spots), [spotsLayoutKey, spots]);

  useEffect(() => {
    setActiveZoneId(pickDefaultZoneId(groupVenueSpotsByZone(spots)));
    setTable(null);
  }, [ctx?.venueId, spotsLayoutKey]);

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

  async function cancelSignal(signalId: string) {
    if (!ctx || !(await confirmDestructive(C.cancelConfirm))) return;
    setCancellingId(signalId);
    try {
      const res = await fetch(`/api/pass-signals/${signalId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueSlug: ctx.venueSlug, station, stationKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash(typeof data.error === "string" ? data.error : "Σφάλμα");
        return;
      }
      void load();
    } finally {
      setCancellingId(null);
    }
  }

  async function send() {
    const manual = manualTable.trim();
    if ((!table && !manual) || !ctx) return;
    const messageText = comment.trim();
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
          message: messageText || undefined,
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">MenuOS</p>
            <h1 className="font-serif text-2xl font-bold sm:text-3xl">
              {ctx?.screenLabel ? `${displayStationTitle} · ${ctx.screenLabel}` : displayStationTitle}
            </h1>
            {ctx ? <p className="mt-1 text-sm text-slate-400 sm:text-base">{ctx.venueName}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0">
            {ctx && typeof ctx.todayCount === "number" ? (
              <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                {C.todayCount(ctx.todayCount)}
              </p>
            ) : null}
            {ctx && quickComments.length > 0 ? (
              <QuickMessagesPanel
                title={C.messagesTitle}
                messages={quickComments}
                selectedMessage={comment}
                disabled={sending}
                onSelect={setComment}
              />
            ) : null}
          </div>
        </div>
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
              const canCancel = signal.status === "READY" || signal.status === "PICKED_UP";
              return (
                <div
                  key={signal.id}
                  className={cn(
                    "relative shrink-0 rounded-xl border",
                    spot && table && spotSelected(table, spot)
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/15 bg-white/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectFromSignal(signal)}
                    className="rounded-xl px-3 py-2 pr-8 text-left transition active:scale-[0.98]"
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
                  {canCancel ? (
                    <button
                      type="button"
                      title={C.cancelSignal}
                      disabled={cancellingId === signal.id}
                      onClick={() => void cancelSignal(signal.id)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/35 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
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
          <div className="mx-auto w-full max-w-2xl space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-3",
                  hasSelection ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5",
                )}
              >
                <MapPin className={cn("h-5 w-5 shrink-0", hasSelection ? "text-cyan-300" : "text-slate-500")} />
                <p className={cn("text-sm font-semibold", hasSelection ? "text-cyan-100" : "text-slate-400")}>
                  {selectedLabel ?? C.noTable}
                </p>
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
                <p
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-center text-sm font-semibold",
                    flash === C.sent ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200",
                  )}
                >
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
