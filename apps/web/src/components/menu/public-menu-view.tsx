"use client";

import { Bell, ChevronLeft, Globe, Minus, Plus, Receipt, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportedLanguage } from "@menuos/db";
import {
  QR_MENU_LANGUAGE_LABELS,
  QR_MENU_LANGUAGES,
  QR_MENU_UI,
  buildOrderPayload,
  cartItemCount,
  cartStorageKey,
  cartTotal,
  formatOrderLineDetail,
  mergeCartLine,
  mergeOrderPayload,
  normalizeWaiterCallLocation,
  orderLineKey,
  parseCartJson,
  parseOrderPayload,
  parseItemExtras,
  pickItemExtraLabel,
  pickQrMenuTranslation,
  resolveExtraLabels,
  computeItemUnitPrice,
  formatExtraPriceSuffix,
  updateCartLineQty,
  isItemLabel,
  type OrderLine,
  type OrderPayload,
  type QrMenuLanguage,
} from "@menuos/shared";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";
import { ItemLabelBadge, MenuItemCard, MenuItemRow } from "@/components/menu/menu-item-card";
import { MenuItemPhotoPlaceholder } from "@/components/menu/menu-item-photo-placeholder";
import { optimizeMenuCardPhotoUrl, optimizeMenuLogoUrl } from "@/lib/menu-photo-url";

type Translation = {
  language: SupportedLanguage;
  name: string;
  description: string | null;
  ingredients?: string | null;
  allergens?: string | null;
};

type Item = {
  id: string;
  price: { toString(): string };
  photoUrl: string | null;
  label: string | null;
  extras?: unknown;
  translations: Translation[];
};

type Category = {
  id: string;
  translations: { language: SupportedLanguage; name: string }[];
  items: Item[];
};

type Menu = {
  id: string;
  name: string;
  categories: Category[];
};

type Venue = {
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  menus: Menu[];
};

type ActionKind = "WAITER" | "BILL" | "CANCEL";
type ActionState = "idle" | "loading" | "success" | "error";
type CallErrorCode = "rate_limited" | "generic";
type CancelErrorCode = "not_cancellable" | "wrong_location" | "rate_limited" | "generic";
type ActiveCallType = "WAITER" | "BILL" | "ORDER";
type CallStatus = "PENDING" | "ACKNOWLEDGED";

type TableCall = {
  id: string;
  type: ActiveCallType;
  status: CallStatus;
  cancellable: boolean;
};

function callStorageKey(
  venueSlug: string,
  tableNumber?: string,
  roomNumber?: string,
  sunbedNumber?: string,
) {
  return `menuos-call:${venueSlug}:${tableNumber ?? ""}:${roomNumber ?? ""}:${sunbedNumber ?? ""}`;
}

function sentOrderStorageKey(cartKey: string) {
  return `${cartKey}:sent-order`;
}

export function PublicMenuView({
  venue,
  language,
  tableNumber,
  roomNumber,
  sunbedNumber,
  embedMode = false,
}: {
  venue: Venue;
  language: QrMenuLanguage;
  tableNumber?: string;
  roomNumber?: string;
  sunbedNumber?: string;
  embedMode?: boolean;
}) {
  const [lang, setLang] = useState<QrMenuLanguage>(language);
  const [activeMenuId, setActiveMenuId] = useState(venue.menus[0]?.id);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [cartLines, setCartLines] = useState<OrderLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sentOrderOpen, setSentOrderOpen] = useState(true);
  const [orderState, setOrderState] = useState<ActionState>("idle");
  const [addedFlash, setAddedFlash] = useState(false);
  const [activeCalls, setActiveCalls] = useState<TableCall[]>([]);
  const [actionState, setActionState] = useState<Record<ActionKind, ActionState>>({
    WAITER: "idle",
    BILL: "idle",
    CANCEL: "idle",
  });
  const [cancellingCallId, setCancellingCallId] = useState<string | null>(null);
  const [callErrorCode, setCallErrorCode] = useState<CallErrorCode | null>(null);
  const [cancelErrorCode, setCancelErrorCode] = useState<CancelErrorCode | null>(null);
  const [orderErrorCode, setOrderErrorCode] = useState<CallErrorCode | null>(null);
  const [callCancellable, setCallCancellable] = useState(false);
  const [sentOrder, setSentOrder] = useState<OrderPayload | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [scrolledFromTop, setScrolledFromTop] = useState(false);
  const actionResetTimersRef = useRef<Partial<Record<ActionKind, ReturnType<typeof setTimeout>>>>({});
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const isEmbedded = embedMode || isInIframe;

  const ui = QR_MENU_UI[lang];
  const activeMenu = venue.menus.find((m) => m.id === activeMenuId) ?? venue.menus[0];
  const storageKey = useMemo(
    () => callStorageKey(venue.slug, tableNumber, roomNumber, sunbedNumber),
    [venue.slug, tableNumber, roomNumber, sunbedNumber],
  );
  const cartKey = useMemo(
    () => cartStorageKey(venue.slug, tableNumber, roomNumber, sunbedNumber),
    [venue.slug, tableNumber, roomNumber, sunbedNumber],
  );

  const persistCart = useCallback(
    (lines: OrderLine[]) => {
      if (lines.length === 0) sessionStorage.removeItem(cartKey);
      else sessionStorage.setItem(cartKey, JSON.stringify(lines));
      setCartLines(lines);
    },
    [cartKey],
  );

  const persistSentOrder = useCallback(
    (payload: OrderPayload | null) => {
      const key = sentOrderStorageKey(cartKey);
      if (!payload?.lines?.length) {
        sessionStorage.removeItem(key);
        setSentOrder(null);
      } else {
        sessionStorage.setItem(key, JSON.stringify(payload));
        setSentOrder(payload);
      }
    },
    [cartKey],
  );

  const clearActiveCall = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    persistSentOrder(null);
    setActiveCalls([]);
    setCallCancellable(false);
  }, [persistSentOrder, storageKey]);

  const applyTableCalls = useCallback(
    (calls: TableCall[]) => {
      setActiveCalls(calls);
      if (!calls.some((c) => c.type === "ORDER")) {
        persistSentOrder(null);
      }
      const cancellable = calls.find((c) => c.cancellable);
      const primary = cancellable ?? calls[0];
      if (primary) {
        setCallCancellable(primary.cancellable);
        sessionStorage.setItem(storageKey, primary.id);
      } else {
        setCallCancellable(false);
        sessionStorage.removeItem(storageKey);
      }
    },
    [persistSentOrder, storageKey],
  );

  const menuLocation = useMemo(
    () => normalizeWaiterCallLocation({ tableNumber, roomNumber, sunbedNumber }),
    [roomNumber, sunbedNumber, tableNumber],
  );

  const fetchTableCalls = useCallback(async (): Promise<TableCall[] | null> => {
    if (!menuLocation.tableNumber && !menuLocation.roomNumber && !menuLocation.sunbedNumber) {
      return [];
    }
    const params = new URLSearchParams({ venueSlug: venue.slug });
    if (menuLocation.tableNumber) params.set("tableNumber", menuLocation.tableNumber);
    if (menuLocation.roomNumber) params.set("roomNumber", menuLocation.roomNumber);
    if (menuLocation.sunbedNumber) params.set("sunbedNumber", menuLocation.sunbedNumber);
    const res = await fetch(`/api/waiter-call/status?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      calls?: Array<{
        id: string;
        type: ActiveCallType;
        status?: CallStatus;
        cancellable?: boolean;
      }>;
    };
    return (data.calls ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status ?? "PENDING",
      cancellable: c.cancellable ?? false,
    }));
  }, [menuLocation, venue.slug]);

  const fetchSentOrderForCall = useCallback(
    async (callId: string): Promise<OrderPayload | null> => {
      const params = new URLSearchParams({ venueSlug: venue.slug, callId });
      if (menuLocation.tableNumber) params.set("tableNumber", menuLocation.tableNumber);
      if (menuLocation.roomNumber) params.set("roomNumber", menuLocation.roomNumber);
      if (menuLocation.sunbedNumber) params.set("sunbedNumber", menuLocation.sunbedNumber);
      const res = await fetch(`/api/waiter-call/status?${params}`);
      if (!res.ok) return null;
      const data = (await res.json()) as { type?: string; orderItems?: unknown };
      if (data.type !== "ORDER" || !data.orderItems) return null;
      return parseOrderPayload(data.orderItems);
    },
    [menuLocation, venue.slug],
  );

  const syncTableStatus = useCallback(async () => {
    try {
      const calls = await fetchTableCalls();
      if (calls === null) return;
      if (calls.length === 0) {
        clearActiveCall();
        return;
      }
      applyTableCalls(calls);
      const orderCall = calls.find((c) => c.type === "ORDER");
      if (orderCall) {
        const fromServer = await fetchSentOrderForCall(orderCall.id);
        if (fromServer) persistSentOrder(fromServer);
      }
    } catch {
      // keep local state on transient errors
    }
  }, [
    applyTableCalls,
    clearActiveCall,
    fetchSentOrderForCall,
    fetchTableCalls,
    persistSentOrder,
  ]);

  const restoreActiveCall = useCallback(async () => {
    await syncTableStatus();
  }, [syncTableStatus]);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (!isEmbedded) return;
    document.documentElement.classList.add("menu-embed");
    document.body.classList.add("menu-embed");
    return () => {
      document.documentElement.classList.remove("menu-embed");
      document.body.classList.remove("menu-embed");
    };
  }, [isEmbedded]);

  useEffect(() => {
    setLang(language);
  }, [language]);

  useEffect(() => {
    setCartLines(parseCartJson(sessionStorage.getItem(cartKey)));
  }, [cartKey]);

  useEffect(() => {
    setItemQty(1);
    setSelectedExtraIds([]);
    setOrderNote("");
  }, [selectedItem?.id]);

  useEffect(() => {
    void restoreActiveCall();
  }, [restoreActiveCall]);

  useEffect(() => {
    if (isEmbedded) {
      setCanGoBack(false);
      return;
    }
    setCanGoBack(window.history.length > 1 || Boolean(document.referrer));
  }, [isEmbedded]);

  useEffect(() => {
    if (isEmbedded) return;
    const syncScroll = () => setScrolledFromTop(window.scrollY > 80);
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, [isEmbedded]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState({}, "", url);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(actionResetTimersRef.current)) {
        if (timer) clearTimeout(timer);
      }
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  function setLanguage(next: QrMenuLanguage) {
    setLang(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next.toLowerCase());
    window.history.replaceState({}, "", url);
  }

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  const locationLabel = useMemo(() => {
    if (tableNumber) return ui.table(tableNumber);
    if (roomNumber) return ui.room(roomNumber);
    if (sunbedNumber) return ui.sunbed(sunbedNumber);
    return null;
  }, [tableNumber, roomNumber, sunbedNumber, ui]);

  function isMenuHome() {
    if (typeof window === "undefined") return true;
    return !selectedItem && !cartOpen && !scrolledFromTop && !window.location.hash;
  }

  function resetToMenuHome() {
    setCartOpen(false);
    setSelectedItem(null);
    if (typeof window !== "undefined" && window.location.hash) {
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState({}, "", url);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function leaveMenu() {
    if (typeof window === "undefined") return;
    try {
      const ref = document.referrer;
      if (ref) {
        const refUrl = new URL(ref);
        const here = new URL(window.location.href);
        if (refUrl.origin === here.origin && refUrl.pathname !== here.pathname) {
          window.location.assign(ref);
          return;
        }
      }
    } catch {
      // fall through
    }
    window.location.assign("/");
  }

  function handleBack() {
    if (cartOpen) {
      setCartOpen(false);
      return;
    }
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }
    if (!isMenuHome()) {
      resetToMenuHome();
      return;
    }
    if (!isEmbedded && canGoBack) {
      leaveMenu();
      return;
    }
    resetToMenuHome();
  }

  function backLabel(): string {
    if (selectedItem || cartOpen) return ui.backToMenu;
    if (!isMenuHome()) return ui.footerHome;
    if (canGoBack) return ui.back;
    return ui.menuTop;
  }

  function resetActionState(kind: ActionKind, delayMs = 3000) {
    const prev = actionResetTimersRef.current[kind];
    if (prev) clearTimeout(prev);
    actionResetTimersRef.current[kind] = setTimeout(() => {
      delete actionResetTimersRef.current[kind];
      setActionState((s) => ({ ...s, [kind]: "idle" }));
      if (kind === "WAITER" || kind === "BILL") setCallErrorCode(null);
      if (kind === "CANCEL") setCancelErrorCode(null);
    }, delayMs);
  }

  async function sendCall(type: "WAITER" | "BILL") {
    if (hasBlockingCall(type)) return;
    setCallErrorCode(null);
    setActionState((s) => ({ ...s, [type]: "loading", CANCEL: "idle" }));
    try {
      const res = await fetch("/api/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          type,
          tableNumber,
          roomNumber,
          sunbedNumber,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        type?: string;
        code?: string;
      };
      if (!res.ok) {
        setCallErrorCode(data.code === "rate_limited" ? "rate_limited" : "generic");
        setActionState((s) => ({ ...s, [type]: "error" }));
        resetActionState(type, 4000);
        return;
      }
      if (data.type && data.type !== type) {
        setCallErrorCode("generic");
        setActionState((s) => ({ ...s, [type]: "error" }));
        resetActionState(type, 4000);
        return;
      }
      setActionState((s) => ({ ...s, [type]: "success" }));
      resetActionState(type);
      void syncTableStatus();
    } catch {
      setActionState((s) => ({ ...s, [type]: "error" }));
      resetActionState(type, 4000);
    }
  }

  function addToCart() {
    if (!selectedItem || !canUseCallActions) return;
    const tr = pickQrMenuTranslation(selectedItem.translations, lang);
    const itemExtras = parseItemExtras(selectedItem.extras);
    const extraIds = selectedExtraIds.filter((id) => itemExtras.some((e) => e.id === id));
    const extras = resolveExtraLabels(itemExtras, extraIds, lang);
    const note = orderNote.trim().slice(0, 80) || undefined;
    const line: OrderLine = {
      itemId: selectedItem.id,
      name: tr?.name ?? "—",
      quantity: itemQty,
      unitPrice: computeItemUnitPrice(selectedItem.price, itemExtras, extraIds),
      ...(extraIds.length ? { extraIds } : {}),
      ...(extras.length ? { extras } : {}),
      ...(note ? { note } : {}),
    };
    persistCart(mergeCartLine(cartLines, line));
    setAddedFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      flashTimerRef.current = null;
      setAddedFlash(false);
      setSelectedItem(null);
    }, 500);
  }

  async function sendOrder() {
    if (!canUseCallActions || cartLines.length === 0) return;
    setOrderErrorCode(null);
    setOrderState("loading");
    setCartOpen(false);
    try {
      const res = await fetch("/api/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          type: "ORDER",
          tableNumber,
          roomNumber,
          sunbedNumber,
          orderItems: buildOrderPayload(cartLines, lang),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        type?: string;
        code?: string;
      };
      if (!res.ok) {
        setOrderErrorCode(data.code === "rate_limited" ? "rate_limited" : "generic");
        setOrderState("error");
        setTimeout(() => setOrderState("idle"), 4000);
        return;
      }
      if (data.type && data.type !== "ORDER") {
        setOrderErrorCode("generic");
        setOrderState("error");
        setTimeout(() => setOrderState("idle"), 4000);
        return;
      }
      const incoming = buildOrderPayload(cartLines, lang);
      persistCart([]);
      if (data.id) {
        const fromServer = await fetchSentOrderForCall(data.id);
        if (fromServer) {
          persistSentOrder(fromServer);
        } else {
          const stored = parseOrderPayload(sessionStorage.getItem(sentOrderStorageKey(cartKey)));
          persistSentOrder(mergeOrderPayload(stored, incoming));
        }
      } else {
        persistSentOrder(incoming);
      }
      setOrderState("success");
      setTimeout(() => setOrderState("idle"), 3000);
      void syncTableStatus();
    } catch {
      setOrderErrorCode("generic");
      setOrderState("error");
      setTimeout(() => setOrderState("idle"), 4000);
    }
  }

  async function cancelCall(callId: string) {
    setCancelErrorCode(null);
    setCancellingCallId(callId);
    setActionState((s) => ({ ...s, CANCEL: "loading" }));
    try {
      const calls = await fetchTableCalls();
      if (calls !== null) {
        if (calls.length > 0) applyTableCalls(calls);
        else clearActiveCall();
      }

      const resolvedCalls = calls ?? activeCalls;
      const target = resolvedCalls.find((c) => c.id === callId && c.cancellable);
      if (!target) {
        setCancelErrorCode("not_cancellable");
        setActionState((s) => ({ ...s, CANCEL: "error" }));
        resetActionState("CANCEL", 4000);
        return;
      }

      const res = await fetch("/api/waiter-call/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          callId: target.id,
          ...menuLocation,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string };
      if (!res.ok) {
        const code =
          data.code === "not_cancellable"
            ? "not_cancellable"
            : data.code === "wrong_location"
              ? "wrong_location"
              : data.code === "rate_limited"
                ? "rate_limited"
                : "generic";
        setCancelErrorCode(code);
        setActionState((s) => ({ ...s, CANCEL: "error" }));
        resetActionState("CANCEL", 4000);
        void syncTableStatus();
        return;
      }
      setActionState((s) => ({ ...s, CANCEL: "success", WAITER: "idle", BILL: "idle" }));
      resetActionState("CANCEL");
      void syncTableStatus();
    } catch {
      setCancelErrorCode("generic");
      setActionState((s) => ({ ...s, CANCEL: "error" }));
      resetActionState("CANCEL", 4000);
    } finally {
      setCancellingCallId(null);
    }
  }

  function buttonLabel(kind: ActionKind): string {
    const state = actionState[kind];
    if (kind === "WAITER") {
      if (state === "success") return ui.called;
      if (state === "error") return callErrorCode === "rate_limited" ? ui.rateLimited : ui.callFailed;
      if (state === "loading") return ui.calling;
      return ui.callWaiter;
    }
    if (kind === "BILL") {
      if (state === "success") return ui.billSent;
      if (state === "error") return callErrorCode === "rate_limited" ? ui.rateLimited : ui.callFailed;
      if (state === "loading") return ui.calling;
      return ui.requestBill;
    }
    if (state === "success") return ui.cancelled;
    if (state === "error") {
      if (cancelErrorCode === "not_cancellable") return ui.cancelNotCancellable;
      if (cancelErrorCode === "wrong_location") return ui.cancelWrongLocation;
      if (cancelErrorCode === "rate_limited") return ui.rateLimited;
      return ui.cancelFailed;
    }
    if (state === "loading") return ui.cancelling;
    if (cancelTarget) return ui.cancelCallType(cancelTarget.type);
    return ui.cancelCall;
  }

  function tName(translations: { language: SupportedLanguage; name: string }[]) {
    return pickQrMenuTranslation(translations, lang)?.name ?? "—";
  }

  const hasBlockingCall = (type: "WAITER" | "BILL") =>
    activeCalls.some(
      (c) => c.type === type && (c.status === "PENDING" || c.status === "ACKNOWLEDGED"),
    );
  const hasActiveOrder = activeCalls.some((c) => c.type === "ORDER");
  const cancellableCalls = activeCalls.filter((c) => c.cancellable);
  const cancelTarget = cancellableCalls[0] ?? null;
  const hasCancellableCall = cancellableCalls.length > 0;
  const multipleCancellable = cancellableCalls.length > 1;
  const canUseCallActions = Boolean(tableNumber || roomNumber || sunbedNumber);

  useEffect(() => {
    if (!menuLocation.tableNumber && !menuLocation.roomNumber && !menuLocation.sunbedNumber) return;
    const intervalMs = hasCancellableCall ? 3000 : 8000;
    const poll = setInterval(() => {
      void syncTableStatus();
    }, intervalMs);
    return () => clearInterval(poll);
  }, [hasCancellableCall, menuLocation, syncTableStatus]);

  const cartCount = cartItemCount(cartLines);
  const cartTotalStr = cartTotal(cartLines);
  const hasCart = cartLines.length > 0;
  const hasSentOrder = Boolean(sentOrder?.lines?.length);

  const categoryNav = activeMenu?.categories ?? [];
  const shell = isEmbedded ? "w-full max-w-full" : "mx-auto max-w-lg";

  return (
    <div
      className={cn(
        isEmbedded
          ? "fixed inset-0 z-0 flex w-full max-w-full flex-col overflow-hidden bg-surface"
          : "min-h-screen bg-surface",
        !isEmbedded && canUseCallActions && (hasCart ? "pb-52" : "pb-36"),
        !isEmbedded && !canUseCallActions && "pb-8",
      )}
    >
      <div
        className={cn(
          isEmbedded && "menu-touch-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        )}
      >
      {!isEmbedded ? (
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className={cn(shell, "flex items-center gap-2 px-3 py-2.5")}>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-button px-2 text-sm font-semibold text-primary hover:bg-surface"
            aria-label={backLabel()}
          >
            <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
            <span className="max-w-[7rem] truncate sm:max-w-none">{backLabel()}</span>
          </button>
          <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-slate-500">
            {venue.name}
            {locationLabel ? ` · ${locationLabel}` : ""}
          </p>
          <button
            type="button"
            onClick={resetToMenuHome}
            className="shrink-0 rounded-button px-2 py-1.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/5"
          >
            {ui.footerHome}
          </button>
        </div>
      </div>
      ) : null}

      {/* Hero — καλωσόρισμα + branding καταστήματος */}
      <header
        className={cn(
          "relative overflow-hidden text-white",
          isEmbedded ? "px-3 pb-3 pt-2" : "px-4 pb-6 pt-5",
        )}
        style={{ background: `linear-gradient(135deg, ${venue.primaryColor}, #121d4a)` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.15) 0%, transparent 40%)",
          }}
          aria-hidden
        />
        <div className={cn("relative", shell)}>
          {!isEmbedded ? (
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">{ui.heroWelcome}</p>
          ) : null}
          <div className={cn("flex gap-3", isEmbedded ? "flex-col" : "mt-3 items-start justify-between")}>
            <div className="flex min-w-0 items-start gap-2.5">
              {venue.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizeMenuLogoUrl(venue.logoUrl, isEmbedded ? 40 : 56)}
                  alt={venue.name}
                  width={isEmbedded ? 40 : 56}
                  height={isEmbedded ? 40 : 56}
                  className={cn(
                    "shrink-0 rounded-full border-2 border-white/30 object-cover shadow-lg",
                    isEmbedded ? "mt-0.5 h-10 w-10" : "mt-0.5 h-14 w-14",
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/15 shadow-lg",
                    isEmbedded ? "h-10 w-10" : "h-14 w-14",
                  )}
                >
                  <UtensilsCrossed
                    className={cn("text-white/90", isEmbedded ? "h-5 w-5" : "h-7 w-7")}
                    aria-hidden
                  />
                </div>
              )}
              <div className="min-w-0">
                <h1
                  className={cn(
                    "font-serif font-bold leading-tight",
                    isEmbedded ? "text-lg" : "text-2xl",
                  )}
                >
                  {venue.name}
                </h1>
                {activeMenu ? (
                  <p className={cn("text-white/75", isEmbedded ? "mt-0.5 text-xs" : "mt-1 text-sm")}>
                    {activeMenu.name}
                  </p>
                ) : null}
                {locationLabel ? (
                  <p
                    className={cn(
                      "inline-block rounded-full bg-white/20 font-semibold backdrop-blur-sm",
                      isEmbedded ? "mt-1.5 px-2 py-0.5 text-[10px]" : "mt-2 px-3 py-1 text-xs",
                    )}
                  >
                    {locationLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-0.5 overflow-x-auto menu-touch-scroll-x rounded-button bg-white/10 p-1 backdrop-blur-sm",
                isEmbedded ? "w-full max-w-none self-start" : "max-w-[11rem] shrink-0",
              )}
              role="group"
              aria-label={ui.language}
            >
              <Globe className="ml-0.5 h-3.5 w-3.5 shrink-0 text-white/70" aria-hidden />
              {QR_MENU_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  aria-label={QR_MENU_LANGUAGE_LABELS[code].ariaLabel}
                  aria-pressed={lang === code}
                  className={cn(
                    "min-w-[2rem] shrink-0 rounded px-1.5 py-1 text-[10px] font-bold tracking-wide",
                    lang === code ? "bg-white text-primary" : "text-white/80 hover:text-white",
                  )}
                >
                  {QR_MENU_LANGUAGE_LABELS[code].short}
                </button>
              ))}
            </div>
          </div>
          {!isEmbedded ? (
            <p className="mt-4 text-sm leading-relaxed text-white/80">{ui.heroHint}</p>
          ) : null}
        </div>
        {venue.menus.length > 1 ? (
          <div className={cn("relative mt-5 flex gap-2 overflow-x-auto menu-touch-scroll-x", shell)}>
            {venue.menus.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveMenuId(menu.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold",
                  activeMenu?.id === menu.id ? "bg-white text-primary" : "bg-white/15 text-white",
                )}
              >
                {menu.name}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {categoryNav.length > 1 ? (
        <nav
          className={cn(
            "sticky z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur",
            isEmbedded ? "top-0" : "top-[53px]",
          )}
        >
          <div
            className={cn(
              shell,
              "menu-touch-scroll-x scrollbar-none flex gap-2 overflow-x-auto",
              isEmbedded ? "px-3 py-1.5" : "px-4 py-2",
            )}
          >
            {categoryNav.map((category) => {
              const id = `cat-${category.id}`;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-brand-blue/10"
                >
                  {tName(category.translations)}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}

      <main className={cn(shell, "space-y-6", isEmbedded ? "px-3 py-4" : "px-4 py-6")}>
        {!activeMenu || activeMenu.categories.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{ui.menuSoon}</p>
        ) : (
          activeMenu.categories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-24">
              <h2 className="font-serif text-xl font-bold text-primary">{tName(category.translations)}</h2>
              {(() => {
                const withPhoto = category.items.filter((item) => item.photoUrl);
                const withoutPhoto = category.items.filter((item) => !item.photoUrl);
                return (
                  <div className="mt-3 space-y-3">
                    {withoutPhoto.length > 0 ? (
                      <div className="overflow-hidden rounded-card border border-slate-100 bg-white shadow-soft divide-y divide-slate-100">
                        {withoutPhoto.map((item) => {
                          const tr = pickQrMenuTranslation(item.translations, lang);
                          return (
                            <MenuItemRow
                              key={item.id}
                              name={tr?.name ?? "—"}
                              description={tr?.description}
                              price={item.price.toString()}
                              label={item.label}
                              lang={lang}
                              onClick={() => setSelectedItem(item)}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                    {withPhoto.length > 0 ? (
                      <div className={cn("grid gap-3", withPhoto.length > 1 ? "sm:grid-cols-2" : "")}>
                        {withPhoto.map((item) => {
                          const tr = pickQrMenuTranslation(item.translations, lang);
                          return (
                            <MenuItemCard
                              key={item.id}
                              name={tr?.name ?? "—"}
                              description={tr?.description}
                              price={item.price.toString()}
                              photoUrl={item.photoUrl!}
                              photoDisplayWidth={isEmbedded ? 140 : 240}
                              photoSizes={
                                isEmbedded
                                  ? "140px"
                                  : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                              }
                              label={item.label}
                              lang={lang}
                              onClick={() => setSelectedItem(item)}
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </section>
          ))
        )}
      </main>

      {!isEmbedded ? (
      <footer
        className={cn(
          shell,
          "border-t border-slate-200/80 bg-white px-4 py-8 text-center",
          canUseCallActions ? "mb-2" : "",
        )}
      >
        <p className="font-serif text-lg font-bold text-primary">{venue.name}</p>
        <p className="mt-1 text-xs text-slate-500">{ui.footerDigitalMenu}</p>
        {locationLabel ? (
          <p className="mt-2 text-sm font-medium text-slate-600">{locationLabel}</p>
        ) : null}
        <div className="mt-5 flex flex-col items-center gap-2">
          <a
            href="https://menuos.gr"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-surface px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-brand-blue/30 hover:text-brand-blue"
          >
            <LogoMark size={18} />
            <span>
              {ui.poweredBy}{" "}
              <span className="font-extrabold text-brand-navy">Menu</span>
              <span className="font-extrabold text-brand-blue">Os</span>
            </span>
          </a>
          <button
            type="button"
            onClick={resetToMenuHome}
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            ↑ {ui.footerHome}
          </button>
        </div>
      </footer>
      ) : null}
      </div>

      {canUseCallActions && hasSentOrder && sentOrder ? (
        <div
          className={cn(
            shell,
            "relative z-40 rounded-card border border-brand-blue/20 bg-brand-blue/5 px-3 py-3",
            isEmbedded
              ? "mx-2 mb-2"
              : cn(
                  "fixed left-0 right-0 z-40 px-3",
                  hasCart
                    ? "bottom-[calc(8.25rem+env(safe-area-inset-bottom))]"
                    : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
                ),
          )}
        >
          <button
            type="button"
            onClick={() => setSentOrderOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="font-semibold text-primary">{ui.yourOrder}</span>
            <span className="text-sm font-bold text-brand-blue">€{sentOrder.total}</span>
          </button>
          {sentOrderOpen ? (
            <>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {sentOrder.lines.map((line) => {
                  const detail = formatOrderLineDetail(line);
                  return (
                  <li key={orderLineKey(line)} className="flex justify-between gap-2">
                    <span>
                      {line.quantity}× {line.name}
                      {detail ? (
                        <span className="mt-0.5 block text-xs font-normal text-slate-500">{detail}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-medium">
                      €{(Number(line.unitPrice) * line.quantity).toFixed(2)}
                    </span>
                  </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-slate-500">{ui.yourOrderHint}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {ui.cartSummary(cartItemCount(sentOrder.lines), sentOrder.total)}
            </p>
          )}
        </div>
      ) : null}

      {canUseCallActions && hasCart ? (
        <div
          className={cn(
            "relative z-50 w-full max-w-full shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur",
            isEmbedded
              ? "px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
              : "fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 px-3 py-2",
          )}
        >
          <div className={cn(shell, "flex items-center gap-2")}>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-button bg-surface px-3 py-2.5 text-left"
            >
              <ShoppingBag className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden />
              <span className="truncate text-sm font-semibold text-primary">
                {ui.cartSummary(cartCount, cartTotalStr)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void sendOrder()}
              disabled={orderState === "loading"}
              className={cn(
                "shrink-0 rounded-button px-4 py-2.5 text-sm font-bold text-white",
                orderState === "success"
                  ? "bg-emerald-600"
                  : orderState === "error"
                    ? "bg-red-600"
                    : "bg-brand-blue",
              )}
            >
              {orderState === "loading"
                ? ui.orderSending
                : orderState === "success"
                  ? ui.orderSent
                  : orderState === "error"
                    ? orderErrorCode === "rate_limited"
                      ? ui.rateLimited
                      : ui.orderFailed
                    : ui.sendOrder}
            </button>
          </div>
        </div>
      ) : null}

      {canUseCallActions ? (
      <div
        className={cn(
          "relative z-50 w-full max-w-full shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur",
          isEmbedded
            ? "px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
            : "fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
        )}
      >
        <div className={cn(shell, !isEmbedded && "gap-2")}>
          {multipleCancellable ? (
            <div
              className={cn(
                "grid gap-1.5",
                cancellableCalls.length === 2 ? "grid-cols-2" : "grid-cols-3",
                isEmbedded ? "mb-1" : "mb-1.5",
              )}
            >
              {cancellableCalls.map((call) => {
                const loading = cancellingCallId === call.id;
                return (
                  <button
                    key={call.id}
                    type="button"
                    onClick={() => void cancelCall(call.id)}
                    disabled={actionState.CANCEL === "loading" && !loading}
                    className={cn(
                      "touch-manipulation flex min-h-9 items-center justify-center gap-1 rounded-button border border-slate-300 bg-white px-1 font-semibold text-slate-700",
                      isEmbedded ? "py-1.5 text-[8px]" : "py-2 text-[10px]",
                      loading && "opacity-70",
                    )}
                  >
                    <X className={cn("shrink-0", isEmbedded ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
                    <span className="text-center leading-tight">{ui.cancelCallType(call.type)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className={cn("grid grid-cols-3 gap-1.5", !isEmbedded && "gap-2")}>
          <button
            type="button"
            onClick={() => void sendCall("WAITER")}
            disabled={actionState.WAITER === "loading" || hasBlockingCall("WAITER")}
            className={cn(
              "touch-manipulation flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-button font-semibold leading-tight",
              isEmbedded ? "py-2 text-[9px]" : "gap-1 py-3 text-[11px]",
              hasBlockingCall("WAITER")
                ? "bg-slate-100 text-slate-400"
                : "bg-primary text-white shadow-glow",
              actionState.WAITER === "success" && "bg-emerald-600 text-white",
              actionState.WAITER === "error" && "bg-red-600 text-white",
            )}
          >
            <Bell className={cn("shrink-0", isEmbedded ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
            <span className="text-center leading-tight">
              {isEmbedded && actionState.WAITER === "idle" ? ui.callWaiterShort : buttonLabel("WAITER")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => void sendCall("BILL")}
            disabled={actionState.BILL === "loading" || hasBlockingCall("BILL")}
            className={cn(
              "touch-manipulation flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-button font-semibold leading-tight",
              isEmbedded ? "py-2 text-[9px]" : "gap-1 py-3 text-[11px]",
              hasBlockingCall("BILL")
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-blue text-white",
              actionState.BILL === "success" && "bg-emerald-600 text-white",
              actionState.BILL === "error" && "bg-red-600 text-white",
            )}
          >
            <Receipt className={cn("shrink-0", isEmbedded ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
            <span className="text-center">{buttonLabel("BILL")}</span>
          </button>
          <button
            type="button"
            onClick={() => cancelTarget && void cancelCall(cancelTarget.id)}
            disabled={!hasCancellableCall || multipleCancellable || actionState.CANCEL === "loading"}
            className={cn(
              "touch-manipulation flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-button border font-semibold leading-tight",
              isEmbedded ? "py-2 text-[9px]" : "gap-1 py-3 text-[11px]",
              hasCancellableCall
                ? "border-slate-300 bg-white text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-400",
              actionState.CANCEL === "success" && "border-emerald-300 bg-emerald-50 text-emerald-800",
              actionState.CANCEL === "error" && "border-red-300 bg-red-50 text-red-800",
            )}
          >
            <X className={cn("shrink-0", isEmbedded ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
            <span className="text-center">{buttonLabel("CANCEL")}</span>
          </button>
          </div>
        </div>
      </div>
      ) : null}

      {selectedItem ? (
        <div
          className={cn(
            "z-50 flex items-end bg-black/50 sm:items-center sm:justify-center",
            isEmbedded ? "absolute inset-0" : "fixed inset-0",
          )}
          onClick={() => setSelectedItem(null)}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-dialog-title"
            tabIndex={-1}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-card bg-white sm:max-w-md sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center border-b border-slate-100 bg-white px-4 py-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
                {ui.backToMenu}
              </button>
            </div>
            <div className="p-6 pt-4">
            {(() => {
              const tr = pickQrMenuTranslation(selectedItem.translations, lang);
              return (
                <>
                  {selectedItem.photoUrl ? (
                    <div className="relative -mx-6 mb-4 aspect-[4/3] overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={optimizeMenuCardPhotoUrl(selectedItem.photoUrl, 360)}
                        alt={tr?.name ?? ""}
                        className="h-full w-full object-cover"
                        decoding="async"
                        sizes="100vw"
                      />
                      {isItemLabel(selectedItem.label) ? (
                        <div className="absolute left-3 top-3">
                          <ItemLabelBadge label={selectedItem.label} lang={lang} />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative -mx-6 mb-4 overflow-hidden">
                      <MenuItemPhotoPlaceholder size="lg" />
                      {isItemLabel(selectedItem.label) ? (
                        <div className="absolute left-3 top-3">
                          <ItemLabelBadge label={selectedItem.label} lang={lang} />
                        </div>
                      ) : null}
                    </div>
                  )}
                  <h3 id="menu-item-dialog-title" className="font-serif text-2xl font-bold text-primary">
                    {tr?.name}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-primary">
                    €
                    {computeItemUnitPrice(
                      selectedItem.price,
                      parseItemExtras(selectedItem.extras),
                      selectedExtraIds.filter((id) =>
                        parseItemExtras(selectedItem.extras).some((e) => e.id === id),
                      ),
                    )}
                  </p>
                  {tr?.description ? (
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">{tr.description}</p>
                  ) : null}
                  {tr?.ingredients ? (
                    <p className="mt-3 text-xs text-slate-500">
                      <span className="font-semibold">{ui.ingredients}:</span> {tr.ingredients}
                    </p>
                  ) : null}
                  {tr?.allergens ? (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold">{ui.allergens}:</span> {tr.allergens}
                    </p>
                  ) : null}
                  {(() => {
                    const itemExtras = parseItemExtras(selectedItem.extras);
                    if (itemExtras.length === 0) return null;
                    return (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-slate-800">{ui.extras}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{ui.extrasHint}</p>
                        <ul className="mt-2 space-y-2">
                          {itemExtras.map((extra) => {
                            const checked = selectedExtraIds.includes(extra.id);
                            const priceSuffix = formatExtraPriceSuffix(extra);
                            return (
                              <li key={extra.id}>
                                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-surface px-3 py-2.5 text-sm has-[:checked]:border-brand-blue has-[:checked]:bg-blue-50/60">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setSelectedExtraIds((prev) =>
                                        checked ? prev.filter((id) => id !== extra.id) : [...prev, extra.id],
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-brand-blue"
                                  />
                                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                    <span className="font-medium text-slate-800">
                                      {pickItemExtraLabel(extra, lang)}
                                    </span>
                                    {priceSuffix ? (
                                      <span className="shrink-0 text-sm font-semibold text-slate-600">
                                        {priceSuffix}
                                      </span>
                                    ) : null}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                  {canUseCallActions ? (
                    <label className="mt-4 block">
                      <span className="text-sm font-semibold text-slate-700">{ui.orderNote}</span>
                      <input
                        type="text"
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        maxLength={80}
                        placeholder={ui.orderNotePlaceholder}
                        className="mt-1.5 w-full rounded-button border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
                      />
                    </label>
                  ) : null}
                  {canUseCallActions ? (
                    <>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">{ui.quantity}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setItemQty((q) => Math.max(1, q - 1))}
                            disabled={itemQty <= 1}
                            aria-label={ui.decreaseQty}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" aria-hidden />
                          </button>
                          <span className="min-w-[2rem] text-center text-lg font-bold text-primary">{itemQty}</span>
                          <button
                            type="button"
                            onClick={() => setItemQty((q) => Math.min(99, q + 1))}
                            disabled={itemQty >= 99}
                            aria-label={ui.increaseQty}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addToCart}
                        className={cn(
                          "mt-4 w-full rounded-button py-3 text-sm font-bold text-white",
                          addedFlash ? "bg-emerald-600" : "bg-brand-blue",
                        )}
                      >
                        {addedFlash ? ui.addedToCart : ui.addToCart}
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="mt-3 w-full rounded-button bg-surface py-2.5 text-sm font-semibold text-primary"
                  >
                    {ui.close}
                  </button>
                </>
              );
            })()}
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div
          className={cn(
            "z-50 flex items-end bg-black/50 sm:items-center sm:justify-center",
            isEmbedded ? "absolute inset-0" : "fixed inset-0",
          )}
          onClick={() => setCartOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-cart-title"
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-card bg-white sm:max-w-md sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <h2 id="menu-cart-title" className="font-serif text-lg font-bold text-primary">
                {ui.cart}
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-button p-2 text-slate-500 hover:bg-surface"
                aria-label={ui.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {cartLines.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">{ui.cartEmpty}</p>
              ) : (
                <ul className="space-y-3">
                  {cartLines.map((line) => {
                    const lineKey = orderLineKey(line);
                    const detail = formatOrderLineDetail(line);
                    return (
                    <li
                      key={lineKey}
                      className="flex items-center justify-between gap-3 rounded-card border border-slate-100 bg-surface px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-primary">{line.name}</p>
                        {detail ? (
                          <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
                        ) : null}
                        <p className="text-xs text-slate-500">€{line.unitPrice}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => persistCart(updateCartLineQty(cartLines, lineKey, line.quantity - 1))}
                          aria-label={ui.decreaseQty}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.25rem] text-center text-sm font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => persistCart(updateCartLineQty(cartLines, lineKey, line.quantity + 1))}
                          disabled={line.quantity >= 99}
                          aria-label={ui.increaseQty}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="w-14 text-right text-sm font-bold text-primary">
                        €{(Number(line.unitPrice) * line.quantity).toFixed(
                          Number(line.unitPrice) * line.quantity % 1 === 0 ? 0 : 2,
                        )}
                      </p>
                    </li>
                    );
                  })}
                </ul>
              )}
              {cartLines.length > 0 ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="flex justify-between text-sm font-semibold text-primary">
                    <span>{ui.cartSummary(cartCount, cartTotalStr)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => void sendOrder()}
                    disabled={orderState === "loading"}
                    className={cn(
                      "mt-4 w-full rounded-button py-3 text-sm font-bold text-white",
                      "bg-brand-blue",
                    )}
                  >
                    {orderState === "loading"
                      ? ui.orderSending
                      : orderState === "success"
                        ? ui.orderSent
                        : orderState === "error"
                          ? orderErrorCode === "rate_limited"
                            ? ui.rateLimited
                            : ui.orderFailed
                          : ui.sendOrder}
                  </button>
                  {hasActiveOrder ? (
                    <p className="mt-2 text-center text-xs text-slate-500">{ui.orderInProgress}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
