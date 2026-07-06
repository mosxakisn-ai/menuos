"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, MapPin, X } from "lucide-react";
import {
  applyZoneLabelOverrides,
  findZoneIdForSpot,
  formatWaiterCallLocation,
  groupVenueSpotsByZone,
  isVenuePassPostStation,
  isVenueSupportPostStation,
  kdsSidebarMessages,
  resolveKdsSendingPost,
  passScreenToPostStation,
  passSendTableNumber,
  pickDefaultZoneId,
  venuePostMatchesZone,
  type PassStationInput,
  type VenuePostStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { confirmDestructive } from "@/lib/confirm-action";
import { cn } from "@/lib/utils";

type ScreenSpot = { type: VenueSpotType; label: string };

type ActiveSignal = {
  id: string;
  station: PassStationInput;
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
  station: VenuePostStationInput;
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
  allKdsPosts?: StationPostOption[];
  supportKdsPosts?: StationPostOption[];
  allQuickComments?: string[];
  allPosts?: boolean;
  spots: ScreenSpot[];
  zoneLabels?: Record<string, string>;
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
    pickPostHint: "Από ποιο πόστο στέλνεις (π.χ. κουζίνα ή μπαρ).",
    messagesNeedTable: "Πρώτα διάλεξε τραπέζι — μετά πάτα το μήνυμα.",
    messagesTapHint: "Πάτα το μήνυμα που θέλεις να στείλεις.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
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
    pickPostHint: "Από ποιο πόστο στέλνεις (π.χ. κουζίνα ή μπαρ).",
    messagesNeedTable: "Πρώτα διάλεξε τραπέζι — μετά πάτα το μήνυμα.",
    messagesTapHint: "Πάτα το μήνυμα που θέλεις να στείλεις.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
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
    pickPostHint: "Από ποιο πόστο στέλνεις (π.χ. κουζίνα ή μπαρ).",
    messagesNeedTable: "Πρώτα διάλεξε τραπέζι — μετά πάτα το μήνυμα.",
    messagesTapHint: "Πάτα το μήνυμα που θέλεις να στείλεις.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
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
    pickPostHint: "Από ποιο πόστο στέλνεις (π.χ. κουζίνα ή μπαρ).",
    messagesNeedTable: "Πρώτα διάλεξε τραπέζι — μετά πάτα το μήνυμα.",
    messagesTapHint: "Πάτα το μήνυμα που θέλεις να στείλεις.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο.",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα: ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
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
const TABLE_GRID_COLS = 4;
const TABLE_GRID_PAGE_SIZE = 16;

function spotKey(spot: ScreenSpot): string {
  return `${spot.type}:${spot.label}`;
}

function spotSelected(selected: ScreenSpot | null, spot: ScreenSpot): boolean {
  return selected?.type === spot.type && selected.label === spot.label;
}

type ZoneSpotEntry = { spot: ScreenSpot; displayLabel: string };

function PassTableGrid({
  spots,
  spotsKey,
  showSpotSecondaryLabel,
  table,
  signalsBySpotKey,
  onSelectSpot,
  waitingReady,
  waitingPicked,
}: {
  spots: ZoneSpotEntry[];
  spotsKey: string;
  showSpotSecondaryLabel: boolean;
  table: ScreenSpot | null;
  signalsBySpotKey: Map<string, ActiveSignal[]>;
  onSelectSpot: (spot: ScreenSpot) => void;
  waitingReady: string;
  waitingPicked: string;
}) {
  const [page, setPage] = useState(0);
  const compact = spots.length > 24;
  const pageCount = Math.max(1, Math.ceil(spots.length / TABLE_GRID_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  useEffect(() => {
    setPage(0);
  }, [spotsKey]);

  useEffect(() => {
    if (!table) return;
    const idx = spots.findIndex(
      (entry) => entry.spot.type === table.type && entry.spot.label === table.label,
    );
    if (idx >= 0) setPage(Math.floor(idx / TABLE_GRID_PAGE_SIZE));
  }, [table, spots]);

  const pageStart = safePage * TABLE_GRID_PAGE_SIZE;
  const pageSpots = spots.slice(pageStart, pageStart + TABLE_GRID_PAGE_SIZE);
  const needsPaging = pageCount > 1;
  const rangeLabel =
    spots.length > 0
      ? `${pageStart + 1}–${Math.min(pageStart + TABLE_GRID_PAGE_SIZE, spots.length)} / ${spots.length}`
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex min-h-0 flex-1 items-stretch gap-1.5">
        {needsPaging ? (
          <button
            type="button"
            aria-label="Προηγούμενα τραπέζια"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-30 sm:w-10"
          >
            <ChevronUp className="h-5 w-5 -rotate-90" />
          </button>
        ) : null}

        <div
          className={cn(
            "grid min-h-0 flex-1 auto-rows-fr gap-2 sm:gap-2.5",
            TABLE_GRID_COLS === 4 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3",
          )}
        >
          {pageSpots.map(({ spot, displayLabel }) => {
            const selected = spotSelected(table, spot);
            const spotSignals = signalsBySpotKey.get(spotKey(spot)) ?? [];
            const latestSignal = spotSignals[0] ?? null;
            const hasSignal = spotSignals.length > 0;
            const pickedUp = latestSignal?.status === "PICKED_UP";
            return (
              <button
                key={`${spot.type}-${spot.label}`}
                type="button"
                onClick={() => onSelectSpot(spot)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 px-1 py-1.5 transition sm:px-1.5 sm:py-2",
                  compact
                    ? hasSignal
                      ? "min-h-[3.75rem] sm:min-h-[4rem]"
                      : "min-h-[2.75rem] sm:min-h-[3rem]"
                    : hasSignal
                      ? "min-h-[5rem] sm:min-h-[5.25rem]"
                      : "min-h-[3.75rem] sm:min-h-[4rem]",
                  selected
                    ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
                    : hasSignal
                      ? pickedUp
                        ? "border-amber-400/70 bg-amber-500/10 text-white hover:border-amber-300 active:scale-[0.98]"
                        : "border-emerald-400/70 bg-emerald-500/10 text-white hover:border-emerald-300 active:scale-[0.98]"
                      : "border-white/15 bg-white/5 text-slate-100 hover:border-white/30 active:scale-[0.98]",
                )}
              >
                {spotSignals.length > 1 ? (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white/20 px-0.5 text-[8px] font-bold leading-none text-white sm:h-4 sm:min-w-4 sm:text-[9px]">
                    {spotSignals.length}
                  </span>
                ) : null}
                {latestSignal?.message ? (
                  <span
                    className={cn(
                      "mb-0.5 max-w-full truncate px-0.5 font-semibold leading-tight",
                      compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-[11px]",
                      pickedUp ? "text-amber-200" : "text-emerald-200",
                    )}
                  >
                    {latestSignal.message}
                  </span>
                ) : hasSignal ? (
                  <span className="mb-0.5 text-[8px] font-medium uppercase tracking-wide text-slate-400 sm:text-[9px]">
                    {pickedUp ? waitingPicked : waitingReady}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "font-bold tabular-nums leading-none",
                    compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
                  )}
                >
                  {displayLabel}
                </span>
                {showSpotSecondaryLabel && spot.label !== displayLabel ? (
                  <span className="mt-0.5 max-w-full truncate text-[8px] font-medium uppercase tracking-wide text-slate-400 sm:text-[9px]">
                    {spot.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {needsPaging ? (
          <button
            type="button"
            aria-label="Επόμενα τραπέζια"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="flex w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-30 sm:w-10"
          >
            <ChevronDown className="h-5 w-5 -rotate-90" />
          </button>
        ) : null}
      </div>

      {needsPaging && rangeLabel ? (
        <p className="shrink-0 text-center text-[10px] font-medium tabular-nums text-slate-500">
          {rangeLabel}
          <span className="mx-1.5 text-slate-600">·</span>
          {safePage + 1}/{pageCount}
        </p>
      ) : null}
    </div>
  );
}

function passStationForSend(
  activePost: StationPostOption | null,
  fallback: PassStationInput,
): PassStationInput {
  if (activePost && isVenuePassPostStation(activePost.station)) {
    return activePost.station;
  }
  return passScreenToPostStation(fallback);
}

/** Prefix support-post messages so waiters see which station sent them. */
function formatPassMessageForSend(
  messageText: string,
  activePost: StationPostOption | null,
  tabletPosts: StationPostOption[],
): string {
  const trimmed = messageText.trim();
  if (!trimmed) return trimmed;

  let post = activePost;
  if (!post || isVenuePassPostStation(post.station)) {
    const supportOwners = tabletPosts.filter(
      (row) =>
        isVenueSupportPostStation(row.station) &&
        row.quickComments.some((chip) => chip.trim() === trimmed),
    );
    if (supportOwners.length === 1) post = supportOwners[0]!;
  }

  if (!post || isVenuePassPostStation(post.station)) return trimmed;
  const label = post.label.trim();
  const prefix = `${label}: `;
  if (trimmed.startsWith(prefix)) return trimmed;
  return `${prefix}${trimmed}`;
}

function pickDefaultActivePost(
  posts: StationPostOption[],
  screenLabel: string | null | undefined,
  screenStation: PassStationInput,
): StationPostOption | null {
  if (!posts.length) return null;
  const label = screenLabel?.trim();
  if (label) {
    const byLabel = posts.find((post) => post.label.trim() === label);
    if (byLabel) return byLabel;
  }
  const postStation = passScreenToPostStation(screenStation);
  const sameStation = posts.filter((post) => post.station === postStation);
  if (sameStation.length > 0) return sameStation[0]!;
  const supportPosts = posts.filter((post) => isVenueSupportPostStation(post.station));
  if (supportPosts.length === 1) return supportPosts[0]!;
  return posts[0]!;
}

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
  stacked = false,
  hideTitle = false,
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
  /** Full-width vertical stack — full message text, one per row (KDS main). */
  stacked?: boolean;
  /** Parent renders section title (e.g. KDS header strip). */
  hideTitle?: boolean;
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

  const chipStyle = (selected: boolean) => {
    if (!accentColor) return undefined;
    return {
      backgroundColor: selected ? `${accentColor}44` : `${accentColor}28`,
      color: "#f8fafc",
      borderColor: selected ? accentColor : `${accentColor}99`,
      boxShadow: selected
        ? `0 0 0 1px ${accentColor}55, inset 3px 0 0 ${accentColor}`
        : `inset 3px 0 0 ${accentColor}`,
    } as const;
  };

  const stackedChipClass = (selected: boolean) =>
    cn(
      "w-full rounded-xl border px-4 py-3.5 text-left text-base font-semibold leading-snug whitespace-normal break-words transition active:scale-[0.99] disabled:opacity-40",
      !accentColor &&
        (selected
          ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.35)]"
          : "border-white/20 bg-white/10 text-slate-100 hover:border-cyan-400/50 hover:bg-cyan-500/15"),
    );

  if (stacked) {
    return (
      <div className="w-full space-y-2">
        {!hideTitle ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        ) : null}
        <div
          ref={listRef}
          onScroll={updateScrollState}
          className="flex max-h-[min(55vh,26rem)] w-full flex-col gap-2 overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.map((chip, index) => {
            const selected = selectedMessage?.trim() === chip;
            return (
              <button
                key={`${index}-${chip}`}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(chip)}
                className={stackedChipClass(selected)}
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
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 px-3.5 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <div
          ref={listRef}
          onScroll={updateScrollState}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 pb-4 pt-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left text-xs font-semibold leading-snug whitespace-normal break-words transition active:scale-[0.99] disabled:opacity-40 sm:text-sm",
                  !accentColor &&
                    (selected
                      ? "border-cyan-400 bg-cyan-500/20 text-white"
                      : "border-white/15 bg-white/10 text-slate-100 hover:border-cyan-400/40"),
                )}
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
        {!hideTitle ? (
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide text-slate-500",
              fullWidth ? "text-left" : "text-right",
            )}
          >
            {title}
          </p>
        ) : null}
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

  const passPosts = ctx?.allKdsPosts?.length ? ctx.allKdsPosts : (ctx?.stationPosts ?? []);
  const supportPosts = ctx?.supportKdsPosts ?? [];
  const tabletPosts = useMemo(
    () => [...passPosts, ...supportPosts.filter((post) => !passPosts.some((row) => row.id === post.id))],
    [passPosts, supportPosts],
  );

  const zoneGroups = useMemo(() => {
    if (!ctx?.spots?.length) return [];
    const groups = groupVenueSpotsByZone(ctx.spots);
    return applyZoneLabelOverrides(groups, ctx.zoneLabels);
  }, [ctx?.spots, ctx?.zoneLabels]);

  const postsForZone = useMemo(() => {
    if (!tabletPosts.length) return [];
    const zoneId = activeZoneId ?? zoneGroups[0]?.id ?? null;
    return tabletPosts.filter((post) => venuePostMatchesZone(post, zoneId));
  }, [tabletPosts, activeZoneId, zoneGroups]);

  const activePost = useMemo(
    () => postsForZone.find((post) => post.id === activePostId) ?? postsForZone[0] ?? null,
    [postsForZone, activePostId],
  );

  const headerMessageColor = activePost?.messageColor ?? ctx?.messageColor ?? null;

  const headerMessages = useMemo(
    () =>
      kdsSidebarMessages(activePost, {
        quickComments: ctx?.quickComments,
        allQuickComments: ctx?.allQuickComments,
      }),
    [activePost, ctx?.quickComments, ctx?.allQuickComments],
  );

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

  const signalsBySpotKey = useMemo(() => {
    const map = new Map<string, ActiveSignal[]>();
    for (const signal of activeSignals) {
      const signalSpot = signalToSpot(signal);
      if (!signalSpot) continue;
      const key = spotKey(signalSpot);
      const rows = map.get(key) ?? [];
      rows.push(signal);
      map.set(key, rows);
    }
    return map;
  }, [activeSignals]);

  useEffect(() => {
    const spotList = ctx?.spots?.length ? ctx.spots : [];
    const groups = applyZoneLabelOverrides(groupVenueSpotsByZone(spotList), ctx?.zoneLabels);
    setActiveZoneId(pickDefaultZoneId(groups));
    setTable(null);
    setActivePostId(null);
  }, [ctx?.venueId, spotsLayoutKey]);

  useEffect(() => {
    if (postsForZone.length === 0) {
      setActivePostId(null);
      return;
    }
    const preferred = pickDefaultActivePost(postsForZone, ctx?.screenLabel, station);
    if (!activePostId || !postsForZone.some((post) => post.id === activePostId)) {
      setActivePostId(preferred?.id ?? null);
    }
  }, [postsForZone, ctx?.screenLabel, activePostId, station]);

  const activeZone = zoneGroups.find((z) => z.id === activeZoneId) ?? zoneGroups[0];
  const visibleSpots = useMemo(() => activeZone?.spots ?? [], [activeZone]);
  const visibleSpotsKey = useMemo(
    () => visibleSpots.map((entry) => `${entry.spot.type}:${entry.spot.label}`).join("|"),
    [visibleSpots],
  );
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
    if (activePostId) {
      const current = tabletPosts.find((post) => post.id === activePostId);
      if (current && !venuePostMatchesZone(current, zoneId)) {
        setActivePostId(null);
      }
    }
  }

  function selectPost(postId: string) {
    setActivePostId(postId);
    setComment("");
  }

  async function cancelSignal(signalId: string) {
    if (!ctx || !(await confirmDestructive(C.cancelConfirm))) return;
    const signal = activeSignals.find((row) => row.id === signalId);
    const cancelStation = signal?.station ?? passStationForSend(activePost, station);
    setCancellingId(signalId);
    try {
      const res = await fetch(`/api/pass-signals/${signalId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueSlug: ctx.venueSlug, station: cancelStation, stationKey }),
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
      const tableNumber = passSendTableNumber(table, manual, activeZoneId, zoneGroups);
      const location = table
        ? table.type === "TABLE"
          ? { tableNumber }
          : table.type === "ROOM"
            ? { roomNumber: table.label }
            : { sunbedNumber: table.label }
        : { tableNumber };

      const sendingPost = resolveKdsSendingPost(messageText, activePost, tabletPosts);
      const sendStation = passStationForSend(sendingPost, station);
      const outboundMessage = formatPassMessageForSend(messageText, sendingPost, tabletPosts);
      const res = await fetch("/api/pass-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: ctx.venueSlug,
          station: sendStation,
          stationKey,
          ...location,
          message: outboundMessage || undefined,
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
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-900 text-white">
      {activeSignals.length > 0 ? (
        <section className="shrink-0 border-b border-white/10 bg-slate-950/60 px-3 py-2 sm:px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {C.waitingTitle} ({activeSignals.length})
          </p>
          <div className="mt-1.5 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeSignals.map((signal) => {
              const spot = signalToSpot(signal);
              const location = formatWaiterCallLocation(signal);
              const picked = signal.status === "PICKED_UP";
              const canCancel = signal.status === "READY" || signal.status === "PICKED_UP";
              return (
                <div
                  key={signal.id}
                  className={cn(
                    "relative shrink-0 rounded-lg border",
                    spot && table && spotSelected(table, spot)
                      ? "border-cyan-400 bg-cyan-500/15"
                      : "border-white/15 bg-white/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectFromSignal(signal)}
                    className="rounded-lg px-2.5 py-1.5 pr-7 text-left transition active:scale-[0.98]"
                  >
                    <p className="text-xs font-bold text-white">{location}</p>
                    {signal.message ? (
                      <p className="mt-0.5 max-w-[8rem] truncate text-[10px] text-slate-300">{signal.message}</p>
                    ) : null}
                    <p
                      className={cn(
                        "mt-0.5 flex items-center gap-1 text-[9px] font-medium",
                        picked ? "text-amber-300" : "text-emerald-300",
                      )}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {picked ? C.waitingPicked : C.waitingReady} · {minutesAgo(signal.readyAt)}
                    </p>
                  </button>
                  {canCancel ? (
                    <button
                      type="button"
                      title={C.cancelSignal}
                      disabled={cancellingId === signal.id}
                      onClick={() => void cancelSignal(signal.id)}
                      className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20 text-red-200 hover:bg-red-500/35 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex min-h-0 w-[38%] max-w-[12.5rem] shrink-0 flex-col border-r border-white/10 bg-slate-950/50 sm:max-w-[13.5rem]">
          <div className="shrink-0 border-b border-white/10 px-3.5 py-3">
            <div aria-label="MenuOS">
              <Logo
                href={false}
                dark
                markSize={34}
                className="gap-2.5"
                markClassName="drop-shadow-[0_4px_14px_rgba(6,182,212,0.32)]"
                wordmarkClassName="text-[15px] leading-none sm:text-base"
              />
            </div>
            <h1 className="mt-2 text-sm font-bold leading-tight sm:text-base">{C.title}</h1>
            {ctx ? <p className="mt-0.5 text-xs text-slate-400">{ctx.venueName}</p> : null}
            {ctx && typeof ctx.todayCount === "number" ? (
              <p className="mt-1 text-[10px] text-slate-500">{C.todayCount(ctx.todayCount)}</p>
            ) : null}
          </div>

          {ctx && headerMessages.length > 0 ? (
            <QuickMessagesPanel
              key={activePost?.id ?? "default"}
              title={C.messagesTitle}
              messages={headerMessages}
              selectedMessage={comment}
              disabled={sending || !hasSelection}
              onSelect={(chip) => void send(chip)}
              sidebar
              accentColor={headerMessageColor}
            />
          ) : ctx ? (
            <p className="flex flex-1 items-start px-3 py-3 text-xs leading-snug text-slate-500">{C.messagesEmpty}</p>
          ) : null}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {error ? (
            <p className="m-3 rounded-lg border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
          ) : null}

          {ctx ? (
            <div className="flex min-h-0 flex-1 flex-col pl-4 pr-3 py-3 sm:pl-5 sm:pr-4 sm:py-4">
              <p className="shrink-0 text-sm font-semibold text-white">{C.pickTable}</p>

              {zoneGroups.length > 1 ? (
                <div
                  className="mt-2 flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                        "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm",
                        activeZone?.id === zone.id
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-white/10 text-slate-300 hover:bg-white/15",
                      )}
                    >
                      {zone.label}
                      <span className="ml-1 text-[10px] font-normal opacity-80">({zone.spots.length})</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {tabletPosts.length > 0 ? (
                <div className="mt-2 shrink-0 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{C.pickPost}</p>
                  {postsForZone.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={C.pickPost}>
                      {postsForZone.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          role="tab"
                          aria-selected={activePost?.id === post.id}
                          onClick={() => selectPost(post.id)}
                          className={cn(
                            "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition sm:px-3 sm:py-1.5 sm:text-sm",
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
                    <p className="text-xs text-slate-500">{C.noPostInZone}</p>
                  )}
                </div>
              ) : null}

              <div className="mt-2 min-h-0 flex-1 overflow-hidden">
                {spots.length > 0 ? (
                  <PassTableGrid
                    spots={visibleSpots}
                    spotsKey={visibleSpotsKey}
                    showSpotSecondaryLabel={zoneGroups.length <= 1}
                    table={table}
                    signalsBySpotKey={signalsBySpotKey}
                    onSelectSpot={selectSpot}
                    waitingReady={C.waitingReady}
                    waitingPicked={C.waitingPicked}
                  />
                ) : ctx.spotPrefix ? (
                  <div className="space-y-2">
                    <p className="rounded-lg border border-amber-400/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
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
                      className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-xl font-bold text-white placeholder:text-slate-500"
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
                    className="h-12 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-xl font-bold text-white placeholder:text-slate-500"
                  />
                )}
              </div>
            </div>
          ) : !error ? (
            <p className="flex flex-1 items-center justify-center text-sm text-slate-500">Φόρτωση…</p>
          ) : null}
        </main>
      </div>

      {ctx ? (
        <footer className="flex shrink-0 border-t border-white/10 bg-slate-950/95 backdrop-blur-sm">
          <div className="flex w-[38%] max-w-[12.5rem] shrink-0 flex-col justify-end self-stretch border-r border-white/10 px-3.5 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-w-[13.5rem] sm:py-3 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="text-[10px] leading-relaxed text-slate-500">
              {hasSelection ? C.messagesTapHint : C.messagesNeedTable}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-3.5 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-4 sm:py-3 sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-stretch gap-2.5">
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-2",
                  hasSelection ? "border-cyan-400/40 bg-cyan-500/10" : "border-white/10 bg-white/5",
                )}
              >
                <MapPin className={cn("h-3.5 w-3.5 shrink-0", hasSelection ? "text-cyan-300" : "text-slate-500")} />
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm",
                    hasSelection ? "text-cyan-100" : "text-slate-400",
                  )}
                >
                  {selectedLabel ?? C.noTable}
                </p>
              </div>

              <button
                type="button"
                disabled={sending || !hasSelection || !comment.trim()}
                onClick={() => void send(undefined)}
                className={cn(
                  "h-10 shrink-0 rounded-lg px-4 text-sm font-bold sm:h-11 sm:px-5",
                  buttonClass("primary", "lg"),
                  "bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50",
                )}
              >
                {sending ? "…" : C.send}
              </button>
            </div>

            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={C.commentPh}
              aria-label={C.comment}
              maxLength={80}
              disabled={sending}
              className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 disabled:opacity-50 sm:h-10"
            />

            {flash ? (
              <p
                className={cn(
                  "rounded-md px-2 py-1 text-center text-[10px] font-semibold leading-snug",
                  flash === C.sent ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200",
                )}
              >
                {flash}
              </p>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
