"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, MapPin, X } from "lucide-react";
import {
  findZoneIdForSpot,
  formatWaiterCallLocation,
  groupVenueSpotsByZone,
  pickDefaultZoneId,
  venuePostMatchesZone,
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

type StationPostOption = {
  id: string;
  label: string;
  zoneId: string | null;
  station: PassStationInput;
  quickComments: string[];
  messageColor: string | null;
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
  messageColor?: string | null;
  stationPosts?: StationPostOption[];
  allPosts?: boolean;
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
    pickPost: "Πόστο",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
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
    pickPost: "Πόστο",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
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
    pickPost: "Πόστο",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
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
    pickPost: "Πόστο",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
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
  layout = "horizontal",
  accentColor,
  fullWidth = false,
  sidebar = false,
}: {
  title: string;
  messages: string[];
  selectedMessage?: string | null;
  disabled: boolean;
  onSelect: (message: string) => void;
  layout?: "horizontal" | "vertical";
  accentColor?: string | null;
  /** Footer row — full width, left-aligned for cook thumb reach. */
  fullWidth?: boolean;
  /** Right rail on KDS — vertical list, full-width tap targets. */
  sidebar?: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const horizontal = layout === "horizontal";

  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      setCanScrollBack(false);
      setCanScrollForward(false);
      setHasOverflow(false);
      return;
    }
    const overflow = horizontal
      ? el.scrollWidth > el.clientWidth + 4
      : el.scrollHeight > el.clientHeight + 4;
    setHasOverflow(overflow);
    if (horizontal) {
      setCanScrollBack(el.scrollLeft > 4);
      setCanScrollForward(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    } else {
      setCanScrollBack(el.scrollTop > 4);
      setCanScrollForward(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    }
  }, [horizontal]);

  useEffect(() => {
    updateScrollState();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);
    return () => observer.disconnect();
  }, [messages, updateScrollState, horizontal]);

  function scrollMessages(direction: "back" | "forward") {
    const el = listRef.current;
    if (!el) return;
    const delta = horizontal
      ? direction === "back"
        ? -180
        : 180
      : direction === "back"
        ? -QUICK_MESSAGE_ROW_PX * 2
        : QUICK_MESSAGE_ROW_PX * 2;
    el.scrollBy({
      left: horizontal ? delta : 0,
      top: horizontal ? 0 : delta,
      behavior: "smooth",
    });
    window.setTimeout(updateScrollState, 320);
  }

  if (messages.length === 0) return null;

  const showArrows = hasOverflow || (horizontal ? messages.length > 3 : messages.length > 4);

  const chipClass = (selected: boolean) =>
    cn(
      "shrink-0 rounded-xl border px-3 py-2.5 text-sm font-semibold leading-snug transition active:scale-[0.98] disabled:opacity-40",
      horizontal
        ? "min-h-[2.75rem] max-w-[11rem] truncate text-left sm:max-w-[14rem]"
        : sidebar
          ? "min-h-[3rem] w-full text-left leading-snug"
          : "min-h-[3.25rem] text-center",
      !accentColor &&
        (selected
          ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
          : "border-white/20 bg-white/10 text-slate-100 hover:border-cyan-400/50 hover:bg-cyan-500/15"),
    );

  const chipStyle = (selected: boolean) => {
    if (!accentColor) return undefined;
    return {
      backgroundColor: selected ? `${accentColor}44` : `${accentColor}28`,
      color: "#f8fafc",
      borderColor: selected ? accentColor : `${accentColor}99`,
      boxShadow: selected ? `0 0 0 1px ${accentColor}55, inset 3px 0 0 ${accentColor}` : `inset 3px 0 0 ${accentColor}`,
    } as const;
  };

  const list = (
    <div
      ref={listRef}
      onScroll={updateScrollState}
      className={cn(
        "scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        horizontal
          ? cn(
              "flex gap-2 overflow-x-auto pb-0.5",
              fullWidth ? "w-full min-w-0" : "max-w-[min(100%,28rem)] sm:max-w-[min(100%,36rem)]",
            )
          : "flex w-[11.5rem] flex-col gap-2 overflow-y-auto sm:w-[13rem]",
      )}
      style={horizontal || sidebar ? undefined : { maxHeight: QUICK_MESSAGES_MAX_HEIGHT_PX }}
    >
      {messages.map((chip, index) => {
        const selected = selectedMessage?.trim() === chip;
        return (
          <button
            key={`${index}-${chip}`}
            type="button"
            disabled={disabled}
            title={chip}
            onClick={() => onSelect(chip)}
            className={chipClass(selected)}
            style={chipStyle(selected)}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );

  if (sidebar) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <p className="shrink-0 border-b border-white/10 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>
        <div
          ref={listRef}
          onScroll={updateScrollState}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3 pt-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.map((chip, index) => {
            const selected = selectedMessage?.trim() === chip;
            return (
              <button
                key={`${index}-${chip}`}
                type="button"
                disabled={disabled}
                title={chip}
                onClick={() => onSelect(chip)}
                className={chipClass(selected)}
                style={chipStyle(selected)}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (horizontal) {
    return (
      <div
        className={cn(
          "flex flex-col gap-1.5",
          fullWidth ? "w-full items-stretch" : "max-w-[min(100%,20rem)] shrink-0 items-end sm:max-w-[min(100%,28rem)]",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide text-slate-500",
            fullWidth ? "text-left" : "text-right",
          )}
        >
          {title}
        </p>
        <div className={cn("flex items-center gap-1.5", fullWidth ? "justify-start" : "justify-end")}>
          {showArrows ? (
            <button
              type="button"
              aria-label="Προηγούμενα μηνύματα"
              disabled={!canScrollBack}
              onClick={() => scrollMessages("back")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronUp className="h-5 w-5 -rotate-90" />
            </button>
          ) : null}
          {list}
          {showArrows ? (
            <button
              type="button"
              aria-label="Επόμενα μηνύματα"
              disabled={!canScrollForward}
              onClick={() => scrollMessages("forward")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronDown className="h-5 w-5 -rotate-90" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-end">
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-col items-stretch gap-2">
          <p className="text-right text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          {list}
        </div>
        {showArrows ? (
          <div className="flex flex-col justify-end gap-2 pb-0.5">
            <button
              type="button"
              aria-label="Προηγούμενα μηνύματα"
              disabled={!canScrollBack}
              onClick={() => scrollMessages("back")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-30"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Επόμενα μηνύματα"
              disabled={!canScrollForward}
              onClick={() => scrollMessages("forward")}
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
  const allPostsMode = searchParams.get("allPosts") === "1";
  const C = COPY[station];

  const [ctx, setCtx] = useState<ScreenContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<ScreenSpot | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [manualTable, setManualTable] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);

  useScreenWakeLock();

  const displayStationTitle = ctx?.stationLabel?.trim() || C.title;
  const stationPosts = ctx?.stationPosts ?? [];

  const zoneGroups = useMemo(
    () => (ctx?.spots?.length ? groupVenueSpotsByZone(ctx.spots) : []),
    [ctx?.spots],
  );

  const postsForZone = useMemo(() => {
    if (!stationPosts.length) return [];
    return stationPosts.filter((post) => venuePostMatchesZone(post, activeZoneId));
  }, [stationPosts, activeZoneId]);

  const activePost = useMemo(
    () => postsForZone.find((post) => post.id === activePostId) ?? postsForZone[0] ?? null,
    [postsForZone, activePostId],
  );

  const quickComments = activePost?.quickComments ?? ctx?.quickComments ?? [];
  const messageColor = activePost?.messageColor ?? ctx?.messageColor ?? null;

  const load = useCallback(async () => {
    if (!venueSlug || !stationKey) {
      setError(C.invalid);
      return;
    }
    const generation = ++loadGenerationRef.current;
    const params = new URLSearchParams({ venueSlug, key: stationKey, station });
    if (allPostsMode) params.set("allPosts", "1");
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
  }, [venueSlug, stationKey, station, allPostsMode, C.invalid]);

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

  useEffect(() => {
    setActiveZoneId(pickDefaultZoneId(groupVenueSpotsByZone(spots)));
    setTable(null);
    setActivePostId(null);
  }, [ctx?.venueId, spotsLayoutKey]);

  useEffect(() => {
    if (postsForZone.length === 0) {
      setActivePostId(null);
      return;
    }
    const screenLabel = ctx?.screenLabel?.trim();
    const matchByLabel = screenLabel
      ? postsForZone.find((post) => post.label === screenLabel)
      : undefined;
    const preferred = matchByLabel ?? postsForZone[0]!;
    if (!activePostId || !postsForZone.some((post) => post.id === activePostId)) {
      setActivePostId(preferred.id);
    }
  }, [postsForZone, ctx?.screenLabel, activePostId]);

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
    setActivePostId(null);
    if (table && findZoneIdForSpot(zoneGroups, table) !== zoneId) {
      setTable(null);
    }
  }

  function selectPost(postId: string) {
    setActivePostId(postId);
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

  async function send(messageOverride?: string) {
    const manual = manualTable.trim();
    if ((!table && !manual) || !ctx) return;
    const messageText = (messageOverride ?? comment).trim();
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

      const sendStation = activePost?.station ?? station;
      const res = await fetch("/api/pass-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: ctx.venueSlug,
          station: sendStation,
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">MenuOS</p>
            <h1 className="font-serif text-2xl font-bold leading-tight sm:text-3xl">
              {ctx?.screenLabel?.trim() &&
              displayStationTitle &&
              ctx.screenLabel.trim() !== displayStationTitle
                ? `${displayStationTitle} · ${ctx.screenLabel.trim()}`
                : displayStationTitle}
            </h1>
            {ctx ? <p className="mt-1 text-sm text-slate-400 sm:text-base">{ctx.venueName}</p> : null}
          </div>
          {ctx && typeof ctx.todayCount === "number" ? (
            <p className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
              {C.todayCount(ctx.todayCount)}
            </p>
          ) : null}
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

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}

        {ctx ? (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <p className="text-base font-semibold text-white sm:text-lg">{C.pickTable}</p>

            {zoneGroups.length > 1 ? (
              <div
                className="flex gap-2 overflow-x-auto border-t border-white/10 pt-3 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

            {stationPosts.length > 0 ? (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{C.pickPost}</p>
                {postsForZone.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-2"
                    role="tablist"
                    aria-label={C.pickPost}
                  >
                    {postsForZone.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        role="tab"
                        aria-selected={activePost?.id === post.id}
                        onClick={() => selectPost(post.id)}
                        className={cn(
                          "shrink-0 rounded-xl border-2 px-4 py-2 text-sm font-semibold transition",
                          activePost?.id === post.id
                            ? "border-transparent text-white"
                            : "border-white/15 bg-white/5 text-slate-300 hover:border-white/25",
                        )}
                        style={
                          activePost?.id === post.id && post.messageColor
                            ? {
                                backgroundColor: `${post.messageColor}33`,
                                borderColor: post.messageColor,
                                boxShadow: `0 0 0 1px ${post.messageColor}55`,
                              }
                            : undefined
                        }
                      >
                        {post.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{C.noPostInZone}</p>
                )}
              </div>
            ) : null}

            {spots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
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
            ) : ctx.spotPrefix ? (
              <div className="space-y-3">
                <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                  {C.emptyZone}
                </p>
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
              </div>
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

      {ctx && quickComments.length > 0 ? (
        <aside className="flex w-[11rem] shrink-0 flex-col border-l border-white/10 bg-slate-950/90 sm:w-[13rem]">
          <QuickMessagesPanel
            title={C.messagesTitle}
            messages={quickComments}
            disabled={sending || !hasSelection}
            onSelect={(chip) => void send(chip)}
            layout="vertical"
            accentColor={messageColor}
            sidebar
          />
        </aside>
      ) : null}
      </div>

      {ctx ? (
        <footer className="shrink-0 border-t border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="mx-auto w-full max-w-4xl space-y-3">
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
                  hasSelection ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5",
                )}
              >
                <MapPin className={cn("h-5 w-5 shrink-0", hasSelection ? "text-cyan-300" : "text-slate-500")} />
                <p className={cn("min-w-0 flex-1 text-sm font-semibold sm:text-base", hasSelection ? "text-cyan-100" : "text-slate-400")}>
                  {selectedLabel ?? C.noTable}
                </p>
                {comment.trim() ? (
                  <span
                    className={cn(
                      "max-w-[12rem] truncate rounded-lg px-2.5 py-1 text-center text-xs font-semibold sm:max-w-xs sm:text-sm",
                      !messageColor && "bg-white/10 text-slate-200",
                    )}
                    style={
                      messageColor
                        ? {
                            backgroundColor: `${messageColor}33`,
                            color: "#f8fafc",
                            border: `1px solid ${messageColor}`,
                            boxShadow: `inset 3px 0 0 ${messageColor}`,
                          }
                        : undefined
                    }
                  >
                    {comment.trim()}
                  </span>
                ) : null}
              </div>

              <label className="block">
                <span className="text-xs text-slate-500">{C.comment}</span>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={C.commentPh}
                  maxLength={80}
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white placeholder:text-slate-600"
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
                onClick={() => void send(undefined)}
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
