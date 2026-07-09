"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, MapPin, X } from "lucide-react";
import {
  applyZoneLabelOverrides,
  findZoneIdForSpot,
  filterWaiterLocationsForZoneView,
  formatWaiterCallLocation,
  formatWaiterCallLocationWithZone,
  groupVenueSpotsByZone,
  isVenuePassPostStation,
  isVenueSupportPostStation,
  kdsSidebarMessages,
  resolveKdsSendingPost,
  passScreenToPostStation,
  passSendTableNumber,
  pickDefaultZoneId,
  resolveWaiterLocationInZone,
  zoneIdForWaiterLocationView,
  venuePostMatchesZone,
  kdsPassDeliveryStatus,
  type PassStationInput,
  type VenuePostStationInput,
  type VenueSpotType,
} from "@menuos/shared";
import { Logo } from "@/components/brand/logo";
import {
  KdsSendRecipientsDialog,
  type KdsPassRecipient,
} from "@/components/dashboard/kds-send-recipients-dialog";
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
  firstSeenAt?: string | null;
  pickedUpAt?: string | null;
  pushTargetCount?: number | null;
  pushSentCount?: number | null;
  pushFailedCount?: number | null;
  repushCount?: number | null;
  lastRepushAt?: string | null;
  seenByStaffMemberName?: string | null;
  pickedUpByStaffMemberName?: string | null;
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
    messagesNeedTable: "Διάλεξε τραπέζι, μετά μήνυμα — και πάτα Αποστολή.",
    messagesTapHint: "Πάτα μήνυμα → μπαίνει κάτω → Αποστολή.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο — ρύθμισέ το από Ρυθμίσεις → Πόστα.",
    noPostInZoneSidebar: "Δεν έχεις πόστο εδώ. Τα μηνύματα φαίνονται μόνο στον χώρο που έχεις πόστο (π.χ. Σάλα).",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα (όλοι οι χώροι): ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    clearWaiting: "Καθάρισμα",
    clearWaitingConfirm: "Να αφαιρεθούν όλες οι ειδοποιήσεις αυτής της ζώνης από την οθόνη;",
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
    messagesNeedTable: "Διάλεξε τραπέζι, μετά μήνυμα — και πάτα Αποστολή.",
    messagesTapHint: "Πάτα μήνυμα → μπαίνει κάτω → Αποστολή.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο — ρύθμισέ το από Ρυθμίσεις → Πόστα.",
    noPostInZoneSidebar: "Δεν έχεις πόστο εδώ. Τα μηνύματα φαίνονται μόνο στον χώρο που έχεις πόστο (π.χ. Σάλα).",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα (όλοι οι χώροι): ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    clearWaiting: "Καθάρισμα",
    clearWaitingConfirm: "Να αφαιρεθούν όλες οι ειδοποιήσεις αυτής της ζώνης από την οθόνη;",
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
    messagesNeedTable: "Διάλεξε τραπέζι, μετά μήνυμα — και πάτα Αποστολή.",
    messagesTapHint: "Πάτα μήνυμα → μπαίνει κάτω → Αποστολή.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο — ρύθμισέ το από Ρυθμίσεις → Πόστα.",
    noPostInZoneSidebar: "Δεν έχεις πόστο εδώ. Τα μηνύματα φαίνονται μόνο στον χώρο που έχεις πόστο (π.χ. Σάλα).",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα (όλοι οι χώροι): ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    clearWaiting: "Καθάρισμα",
    clearWaitingConfirm: "Να αφαιρεθούν όλες οι ειδοποιήσεις αυτής της ζώνης από την οθόνη;",
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
    messagesNeedTable: "Διάλεξε τραπέζι, μετά μήνυμα — και πάτα Αποστολή.",
    messagesTapHint: "Πάτα μήνυμα → μπαίνει κάτω → Αποστολή.",
    noPostInZone: "Δεν υπάρχει πόστο για αυτόν τον χώρο — ρύθμισέ το από Ρυθμίσεις → Πόστα.",
    noPostInZoneSidebar: "Δεν έχεις πόστο εδώ. Τα μηνύματα φαίνονται μόνο στον χώρο που έχεις πόστο (π.χ. Σάλα).",
    emptyZone: "Δεν βρέθηκαν τραπέζια στη ζώνη αυτής της οθόνης.",
    invalid: "Μη έγκυρο link οθόνης.",
    waitingTitle: "Σε αναμονή",
    waitingReady: "Περιμένει σερβιτόρο",
    waitingPicked: "Ο σερβιτόρος πήγε",
    noTable: "Διάλεξε τραπέζι δεξιά",
    todayCount: (n: number) => `Σήμερα (όλοι οι χώροι): ${n} ειδοποιήσεις`,
    messagesTitle: "Μηνύματα",
    messagesEmpty: "Δεν έχεις ρυθμίσει μηνύματα — πρόσθεσέ τα στο tab Μηνύματα (κουζίνα, μπαρ κ.λπ.).",
    messagesAllPostsHint: "Μηνύματα από όλα τα πόστα — φτάνουν στον σερβιτόρο στο τραπέζι.",
    cancelSignal: "Ακύρωση",
    cancelConfirm: "Ακύρωση αυτής της ειδοποίησης;",
    clearWaiting: "Καθάρισμα",
    clearWaitingConfirm: "Να αφαιρεθούν όλες οι ειδοποιήσεις αυτής της ζώνης από την οθόνη;",
    quickComments: ["Με παγωτό", "Χωρίς ζάχαρη", "Ξέχασες κουταλάκι", "Επείγον"],
  },
};

function signalLocationLabel(
  signal: ActiveSignal,
  zoneGroups: ReturnType<typeof groupVenueSpotsByZone>,
  activeZoneId: string | null,
  activeZone: ReturnType<typeof groupVenueSpotsByZone>[number] | undefined,
): string {
  const withZone = formatWaiterCallLocationWithZone(signal, zoneGroups, { activeZoneId });
  if (zoneGroups.length <= 1 || !activeZone || withZone.includes(" · ")) return withZone;

  const resolved = resolveWaiterLocationInZone(signal, activeZoneId, zoneGroups);
  if (resolved) {
    const entry = activeZone.spots.find(
      (row) => row.spot.type === resolved.spot.type && row.spot.label === resolved.spot.label,
    );
    const spotLocation =
      resolved.spot.type === "TABLE"
        ? { tableNumber: entry?.displayLabel ?? resolved.spot.label }
        : resolved.spot.type === "ROOM"
          ? { roomNumber: resolved.spot.label }
          : { sunbedNumber: resolved.spot.label };
    return `${activeZone.label} · ${formatWaiterCallLocation(spotLocation)}`;
  }

  return `${activeZone.label} · ${formatWaiterCallLocation(signal)}`;
}

function selectedTableLabel(
  table: ScreenSpot | null,
  manualTable: string,
  zoneGroups: ReturnType<typeof groupVenueSpotsByZone>,
  activeZoneId: string | null,
): string | null {
  if (table) {
    const location =
      table.type === "TABLE"
        ? { tableNumber: table.label }
        : table.type === "ROOM"
          ? { roomNumber: table.label }
          : { sunbedNumber: table.label };
    return formatWaiterCallLocationWithZone(location, zoneGroups, { activeZoneId });
  }
  const manual = manualTable.trim();
  if (!manual) return null;
  return formatWaiterCallLocationWithZone({ tableNumber: manual }, zoneGroups, { activeZoneId });
}

export type StationScreenKind = keyof typeof COPY;

const EMPTY_SPOTS: ScreenSpot[] = [];
const POLL_MS = 8_000;
const QUICK_MESSAGE_ROW_PX = 56;
const QUICK_MESSAGES_MAX_HEIGHT_PX = QUICK_MESSAGE_ROW_PX * 4 + 8;
const TABLE_GRID_COLS = 4;
/** Fixed tile row height (must match `auto-rows-[…]` on the grid). */
const TABLE_TILE_ROW_PX = 56;
const TABLE_GRID_GAP_PX = 8;
const TABLE_GRID_SCROLL_ROW_PX = (TABLE_TILE_ROW_PX + TABLE_GRID_GAP_PX) * 2;
const KDS_SCROLL_ARROW_BUTTON_CLASS =
  "flex shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30";

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
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = gridRef.current;
    if (!el) {
      setCanScrollBack(false);
      setCanScrollForward(false);
      setHasOverflow(false);
      return;
    }
    const overflow = el.scrollHeight > el.clientHeight + 4;
    setHasOverflow(overflow);
    setCanScrollBack(el.scrollTop > 4);
    setCanScrollForward(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const raf = requestAnimationFrame(() => {
      updateScrollState();
      requestAnimationFrame(updateScrollState);
    });
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(raf);
    }
    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [spotsKey, spots.length, updateScrollState]);

  const needsScrollRail = hasOverflow || spots.length > TABLE_GRID_COLS * 4;

  useEffect(() => {
    if (!table) return;
    const btn = tileRefs.current.get(spotKey(table));
    btn?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [table, spotsKey]);

  function scrollGrid(direction: "back" | "forward") {
    const el = gridRef.current;
    if (!el) return;
    const delta =
      direction === "back" ? -TABLE_GRID_SCROLL_ROW_PX * 2 : TABLE_GRID_SCROLL_ROW_PX * 2;
    el.scrollBy({ top: delta, behavior: "smooth" });
    window.setTimeout(updateScrollState, 320);
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 items-stretch gap-1.5">
      <div
        ref={gridRef}
        onScroll={updateScrollState}
        className={cn(
          "grid h-full min-h-0 min-w-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain scroll-smooth sm:gap-2",
          "auto-rows-[3.5rem]",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          TABLE_GRID_COLS === 4 ? "grid-cols-4" : "grid-cols-3",
        )}
      >
        {spots.map(({ spot, displayLabel }) => {
          const selected = spotSelected(table, spot);
          const spotSignals = signalsBySpotKey.get(spotKey(spot)) ?? [];
          const latestSignal = spotSignals[0] ?? null;
          const hasSignal = spotSignals.length > 0;
          const pickedUp = latestSignal?.status === "PICKED_UP";
          const key = spotKey(spot);
          return (
            <button
              key={`${spot.type}-${spot.label}`}
              ref={(el) => {
                if (el) tileRefs.current.set(key, el);
                else tileRefs.current.delete(key);
              }}
              type="button"
              onClick={() => onSelectSpot(spot)}
              className={cn(
                "relative flex h-full w-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 px-1 py-0.5 transition",
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
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white/20 px-0.5 text-[8px] font-bold leading-none text-white">
                  {spotSignals.length}
                </span>
              ) : null}
              {latestSignal?.message ? (
                <span
                  className={cn(
                    "mb-0.5 max-w-full truncate px-0.5 text-[9px] font-semibold leading-tight sm:text-[10px]",
                    pickedUp ? "text-amber-200" : "text-emerald-200",
                  )}
                >
                  {latestSignal.message}
                </span>
              ) : hasSignal ? (
                <span className="mb-0.5 max-w-full truncate text-[8px] font-medium uppercase tracking-wide text-slate-400">
                  {pickedUp ? waitingPicked : waitingReady}
                </span>
              ) : null}
              <span className="shrink-0 text-lg font-bold tabular-nums leading-none sm:text-xl">{displayLabel}</span>
              {showSpotSecondaryLabel && spot.label !== displayLabel ? (
                <span className="mt-0.5 max-w-full shrink truncate text-[8px] font-medium uppercase tracking-wide text-slate-400">
                  {spot.label}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {needsScrollRail ? (
        <div className="flex w-9 shrink-0 flex-col justify-center gap-1 py-1 sm:w-10">
          <button
            type="button"
            aria-label="Προηγούμενα τραπέζια"
            disabled={!canScrollBack}
            onClick={() => scrollGrid("back")}
            className={cn(KDS_SCROLL_ARROW_BUTTON_CLASS, "h-9 w-9 sm:h-10 sm:w-10")}
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Επόμενα τραπέζια"
            disabled={!canScrollForward}
            onClick={() => scrollGrid("forward")}
            className={cn(KDS_SCROLL_ARROW_BUTTON_CLASS, "h-9 w-9 sm:h-10 sm:w-10")}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      {canScrollForward ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 right-10 h-8 bg-gradient-to-t from-slate-950/95 to-transparent sm:right-11"
          aria-hidden
        />
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

  const scrollArrowButtonClass =
    "flex shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-30";

  if (sidebar) {
    const sidebarShowArrows = showArrows || messages.length > 4;
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 px-3.5 pt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <div className="relative flex min-h-0 flex-1 items-stretch gap-1 px-2 pb-2 pt-1">
          <div
            ref={listRef}
            onScroll={updateScrollState}
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-1.5 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                    "w-full shrink-0 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold leading-snug whitespace-normal break-words transition active:scale-[0.99] disabled:opacity-40 sm:text-sm",
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
          {sidebarShowArrows ? (
            <div className="flex w-9 shrink-0 flex-col justify-center gap-1 py-1">
              <button
                type="button"
                aria-label="Προηγούμενα μηνύματα"
                disabled={!canScrollBack}
                onClick={() => scrollMessages("back")}
                className={cn(scrollArrowButtonClass, "h-9 w-9")}
              >
                <ChevronUp className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Επόμενα μηνύματα"
                disabled={!canScrollForward}
                onClick={() => scrollMessages("forward")}
                className={cn(scrollArrowButtonClass, "h-9 w-9")}
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          ) : null}
          {canScrollForward ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-2 h-8 bg-gradient-to-t from-slate-950/95 to-transparent"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    );
  }

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

function deliveryToneClass(tone: ReturnType<typeof kdsPassDeliveryStatus>["tone"]): string {
  switch (tone) {
    case "danger":
      return "text-red-300";
    case "warn":
      return "text-amber-300";
    case "seen":
      return "text-cyan-300";
    case "picked":
      return "text-amber-300";
    default:
      return "text-emerald-300";
  }
}

function deliveryBorderClass(tone: ReturnType<typeof kdsPassDeliveryStatus>["tone"]): string {
  switch (tone) {
    case "danger":
      return "border-red-400/60 bg-red-500/10";
    case "warn":
      return "border-amber-400/60 bg-amber-500/10";
    case "seen":
      return "border-cyan-400/60 bg-cyan-500/10";
    case "picked":
      return "border-amber-400/70 bg-amber-500/10";
    default:
      return "border-emerald-400/70 bg-emerald-500/10";
  }
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
  const [clearingWaiting, setClearingWaiting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogLoading, setSendDialogLoading] = useState(false);
  const [sendRecipients, setSendRecipients] = useState<KdsPassRecipient[]>([]);
  const [sendRecipientsZoneLabel, setSendRecipientsZoneLabel] = useState<string | null>(null);
  const loadGenerationRef = useRef(0);

  useScreenWakeLock();

  const passPosts = useMemo(() => {
    if (allPostsMode || ctx?.allPosts) return ctx?.allKdsPosts ?? ctx?.stationPosts ?? [];
    return ctx?.stationPosts ?? [];
  }, [allPostsMode, ctx?.allPosts, ctx?.allKdsPosts, ctx?.stationPosts]);
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

  const headerMessages = useMemo(() => {
    if (postsForZone.length === 0) return [];
    return kdsSidebarMessages(activePost, {
      quickComments: ctx?.quickComments,
      allQuickComments: ctx?.allQuickComments,
    });
  }, [activePost, postsForZone.length, ctx?.quickComments, ctx?.allQuickComments]);

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

  const zoneSignalCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (zoneGroups.length <= 1) return counts;
    for (const signal of activeSignals) {
      const zoneId = zoneIdForWaiterLocationView(signal, zoneGroups);
      if (!zoneId) continue;
      counts.set(zoneId, (counts.get(zoneId) ?? 0) + 1);
    }
    return counts;
  }, [activeSignals, zoneGroups]);

  const zoneFilteredSignals = useMemo(() => {
    if (zoneGroups.length <= 1) return activeSignals;
    const zoneId = activeZoneId ?? zoneGroups[0]?.id;
    if (!zoneId) return activeSignals;
    return filterWaiterLocationsForZoneView(activeSignals, zoneId, zoneGroups);
  }, [activeSignals, activeZoneId, zoneGroups]);

  const signalsBySpotKey = useMemo(() => {
    const map = new Map<string, ActiveSignal[]>();
    for (const signal of zoneFilteredSignals) {
      const signalSpot = signalToSpot(signal);
      if (!signalSpot) continue;
      const key = spotKey(signalSpot);
      const rows = map.get(key) ?? [];
      rows.push(signal);
      map.set(key, rows);
    }
    return map;
  }, [zoneFilteredSignals]);

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
  const canSend = hasSelection && comment.trim().length > 0 && postsForZone.length > 0;

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
      setComment("");
    }
    const postsInZone = tabletPosts.filter((post) => venuePostMatchesZone(post, zoneId));
    if (postsInZone.length === 0) {
      setActivePostId(null);
      setComment("");
    } else if (activePostId) {
      const current = tabletPosts.find((post) => post.id === activePostId);
      if (current && !venuePostMatchesZone(current, zoneId)) {
        setActivePostId(null);
        setComment("");
      }
    }
  }

  function selectPost(postId: string) {
    setActivePostId(postId);
    setComment("");
  }

  function selectMessageChip(chip: string) {
    const trimmed = chip.trim();
    if (!trimmed || sending) return;
    setComment(trimmed);
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

  async function clearWaitingSignals() {
    if (!ctx || zoneFilteredSignals.length === 0) return;
    if (!(await confirmDestructive(C.clearWaitingConfirm))) return;
    setClearingWaiting(true);
    try {
      const res = await fetch("/api/pass-signals/dismiss-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: ctx.venueSlug,
          station,
          stationKey,
          signalIds: zoneFilteredSignals.map((row) => row.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash(typeof data.error === "string" ? data.error : "Σφάλμα");
        return;
      }
      const dismissed = typeof data.dismissed === "number" ? data.dismissed : 0;
      if (dismissed < zoneFilteredSignals.length) {
        setFlash(
          dismissed === 0
            ? "Δεν αφαιρέθηκε καμία ειδοποίηση."
            : `Αφαιρέθηκαν ${dismissed} από ${zoneFilteredSignals.length}.`,
        );
        setTimeout(() => setFlash(null), 3500);
      }
      void load();
    } finally {
      setClearingWaiting(false);
    }
  }

  async function openSendDialog() {
    if ((!table && !manualTable.trim()) || !ctx || !canSend) return;
    setSendDialogOpen(true);
    setSendDialogLoading(true);
    setSendRecipients([]);
    setSendRecipientsZoneLabel(null);
    try {
      const messageText = comment.trim();
      const sendingPost = resolveKdsSendingPost(
        messageText,
        activePost,
        postsForZone.length ? postsForZone : tabletPosts,
      );
      const sendStation = passStationForSend(sendingPost, station);
      const params = new URLSearchParams({
        venueSlug: ctx.venueSlug,
        key: stationKey,
        station,
        passStation: sendStation,
      });
      const zoneId = activeZoneId ?? zoneGroups[0]?.id;
      if (zoneId) params.set("zoneId", zoneId);
      const res = await fetch(`/api/station-screen/recipients?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setFlash(typeof data.error === "string" ? data.error : "Σφάλμα");
        setSendDialogOpen(false);
        return;
      }
      setSendRecipients((data.recipients ?? []) as KdsPassRecipient[]);
      setSendRecipientsZoneLabel(typeof data.zoneLabel === "string" ? data.zoneLabel : null);
    } finally {
      setSendDialogLoading(false);
    }
  }

  async function send(messageOverride?: string, notifyStaffMemberIds?: string[]) {
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

      const sendingPost = resolveKdsSendingPost(messageText, activePost, postsForZone.length ? postsForZone : tabletPosts);
      const sendStation = passStationForSend(sendingPost, station);
      const outboundMessage = formatPassMessageForSend(messageText, sendingPost, tabletPosts);
      const zoneId = activeZoneId ?? zoneGroups[0]?.id ?? undefined;
      const res = await fetch("/api/pass-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: ctx.venueSlug,
          station: sendStation,
          stationKey,
          ...location,
          message: outboundMessage || undefined,
          ...(zoneId ? { zoneId } : {}),
          ...(notifyStaffMemberIds && notifyStaffMemberIds.length > 0
            ? { notifyStaffMemberIds }
            : {}),
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

  async function confirmSend(selectedIds: string[]) {
    if (selectedIds.length === 0 && sendRecipients.length > 0) return;
    setSendDialogOpen(false);
    await send(undefined, selectedIds.length > 0 ? selectedIds : undefined);
  }

  const selectedLabel = selectedTableLabel(table, manualTable, zoneGroups, activeZoneId);

  const waitingHeading =
    zoneGroups.length > 1 && activeZone
      ? `${C.waitingTitle} · ${activeZone.label}${zoneFilteredSignals.length > 0 ? ` (${zoneFilteredSignals.length})` : ""}`
      : zoneFilteredSignals.length > 0
        ? `${C.waitingTitle} (${zoneFilteredSignals.length})`
        : C.waitingTitle;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-900 text-white">
      <header className="flex shrink-0 items-stretch gap-2 border-b border-white/10 bg-slate-950/80 sm:gap-3">
        <div className="flex w-[38%] max-w-[12.5rem] shrink-0 flex-col justify-center border-r border-white/10 px-3 py-2 sm:max-w-[13.5rem] sm:px-3.5 sm:py-2.5">
          <div aria-label="MenuOS">
            <Logo
              href={false}
              dark
              markSize={30}
              className="gap-2"
              markClassName="drop-shadow-[0_4px_14px_rgba(6,182,212,0.32)]"
              wordmarkClassName="text-sm leading-none sm:text-[15px]"
            />
          </div>
          <h1 className="mt-1.5 text-sm font-bold leading-tight sm:text-base">{C.title}</h1>
          {ctx ? <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">{ctx.venueName}</p> : null}
          {ctx && typeof ctx.todayCount === "number" ? (
            <p className="mt-0.5 text-[10px] text-slate-500">{C.todayCount(ctx.todayCount)}</p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3 sm:py-2.5 sm:pr-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{waitingHeading}</p>
            {zoneFilteredSignals.length > 0 ? (
              <button
                type="button"
                disabled={clearingWaiting || cancellingId !== null}
                onClick={() => void clearWaitingSignals()}
                className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10 disabled:opacity-40 sm:text-xs"
              >
                {clearingWaiting ? "…" : C.clearWaiting}
              </button>
            ) : null}
          </div>
          {zoneFilteredSignals.length > 0 ? (
            <div className="mt-1 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {zoneFilteredSignals.map((signal) => {
                const spot = signalToSpot(signal);
                const location = signalLocationLabel(signal, zoneGroups, activeZoneId, activeZone);
                const delivery = kdsPassDeliveryStatus(signal);
                const canCancel = signal.status === "READY" || signal.status === "PICKED_UP";
                return (
                  <div
                    key={signal.id}
                    className={cn(
                      "relative shrink-0 rounded-lg border",
                      spot && table && spotSelected(table, spot)
                        ? "border-cyan-400 bg-cyan-500/15"
                        : deliveryBorderClass(delivery.tone),
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
                          deliveryToneClass(delivery.tone),
                        )}
                      >
                        <Clock className="h-2.5 w-2.5" />
                        {delivery.label} · {minutesAgo(signal.readyAt)}
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
          ) : ctx ? (
            <p className="mt-0.5 text-[10px] text-slate-600">Καμία ενεργή ειδοποίηση σε αυτόν τον χώρο.</p>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex min-h-0 w-[38%] max-w-[12.5rem] shrink-0 flex-col border-r border-white/10 bg-slate-950/50 sm:max-w-[13.5rem]">
          {ctx && headerMessages.length > 0 ? (
            <QuickMessagesPanel
              key={activePost?.id ?? "default"}
              title={C.messagesTitle}
              messages={headerMessages}
              selectedMessage={comment}
              disabled={sending}
              onSelect={selectMessageChip}
              sidebar
              accentColor={headerMessageColor}
            />
          ) : ctx && postsForZone.length === 0 && tabletPosts.length > 0 ? (
            <p className="flex flex-1 items-start px-3 py-3 text-xs leading-snug text-slate-500">
              {C.noPostInZoneSidebar}
            </p>
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
                  {zoneGroups.map((zone) => {
                    const pending = zoneSignalCounts.get(zone.id) ?? 0;
                    return (
                    <button
                      key={zone.id}
                      type="button"
                      role="tab"
                      aria-selected={activeZone?.id === zone.id}
                      onClick={() => selectZone(zone.id)}
                      className={cn(
                        "relative shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm",
                        activeZone?.id === zone.id
                          ? "bg-cyan-500 text-slate-950"
                          : pending > 0
                            ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/50 hover:bg-amber-500/30"
                          : "bg-white/10 text-slate-300 hover:bg-white/15",
                      )}
                    >
                      {zone.label}
                      <span className="ml-1 text-[10px] font-normal opacity-80">
                        ({zone.spots.length}
                        {pending > 0 ? ` · ${pending} μην.` : ""})
                      </span>
                    </button>
                    );
                  })}
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

              <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
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
                disabled={sending || !canSend}
                onClick={() => void openSendDialog()}
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

      <KdsSendRecipientsDialog
        open={sendDialogOpen}
        loading={sendDialogLoading}
        recipients={sendRecipients}
        zoneLabel={sendRecipientsZoneLabel ?? activeZone?.label ?? null}
        tableLabel={selectedLabel}
        message={comment}
        sending={sending}
        onClose={() => {
          if (!sending) setSendDialogOpen(false);
        }}
        onConfirm={(selectedIds) => void confirmSend(selectedIds)}
      />
    </div>
  );
}
