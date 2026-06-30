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
  mergeCartLine,
  parseCartJson,
  pickQrMenuTranslation,
  updateCartLineQty,
  type OrderLine,
  type QrMenuLanguage,
} from "@menuos/shared";
import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";
import { ItemLabelBadge, MenuItemCard } from "@/components/menu/menu-item-card";
import { isItemLabel } from "@menuos/shared";

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
type ActiveCallType = "WAITER" | "BILL" | "ORDER";
type CallStatus = "PENDING" | "ACKNOWLEDGED";

type TableCall = {
  id: string;
  type: ActiveCallType;
  status: CallStatus;
  cancellable: boolean;
};

function callStorageKey(venueSlug: string, tableNumber?: string, roomNumber?: string) {
  return `menuos-call:${venueSlug}:${tableNumber ?? ""}:${roomNumber ?? ""}`;
}

export function PublicMenuView({
  venue,
  language,
  tableNumber,
  roomNumber,
  embedMode = false,
}: {
  venue: Venue;
  language: QrMenuLanguage;
  tableNumber?: string;
  roomNumber?: string;
  embedMode?: boolean;
}) {
  const [lang, setLang] = useState<QrMenuLanguage>(language);
  const [activeMenuId, setActiveMenuId] = useState(venue.menus[0]?.id);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [cartLines, setCartLines] = useState<OrderLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderState, setOrderState] = useState<ActionState>("idle");
  const [addedFlash, setAddedFlash] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCalls, setActiveCalls] = useState<TableCall[]>([]);
  const [actionState, setActionState] = useState<Record<ActionKind, ActionState>>({
    WAITER: "idle",
    BILL: "idle",
    CANCEL: "idle",
  });
  const [callErrorCode, setCallErrorCode] = useState<CallErrorCode | null>(null);
  const [callCancellable, setCallCancellable] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const resetTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const isEmbedded = embedMode || isInIframe;

  const ui = QR_MENU_UI[lang];
  const activeMenu = venue.menus.find((m) => m.id === activeMenuId) ?? venue.menus[0];
  const storageKey = useMemo(
    () => callStorageKey(venue.slug, tableNumber, roomNumber),
    [venue.slug, tableNumber, roomNumber],
  );
  const cartKey = useMemo(
    () => cartStorageKey(venue.slug, tableNumber, roomNumber),
    [venue.slug, tableNumber, roomNumber],
  );

  const persistCart = useCallback(
    (lines: OrderLine[]) => {
      if (lines.length === 0) sessionStorage.removeItem(cartKey);
      else sessionStorage.setItem(cartKey, JSON.stringify(lines));
      setCartLines(lines);
    },
    [cartKey],
  );

  const clearActiveCall = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setActiveCallId(null);
    setActiveCalls([]);
    setCallCancellable(false);
  }, [storageKey]);

  const applyTableCalls = useCallback((calls: TableCall[]) => {
    setActiveCalls(calls);
    const cancellable = calls.find((c) => c.cancellable);
    const primary = cancellable ?? calls[0];
    if (primary) {
      setActiveCallId(primary.id);
      setCallCancellable(primary.cancellable);
      sessionStorage.setItem(storageKey, primary.id);
    } else {
      setActiveCallId(null);
      setCallCancellable(false);
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const syncTableStatus = useCallback(async () => {
    if (!tableNumber && !roomNumber) return;
    try {
      const params = new URLSearchParams({ venueSlug: venue.slug });
      if (tableNumber) params.set("tableNumber", tableNumber);
      if (roomNumber) params.set("roomNumber", roomNumber);
      const res = await fetch(`/api/waiter-call/status?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        calls?: Array<{ id: string; type: ActiveCallType; status?: CallStatus; cancellable?: boolean }>;
      };
      const calls = (data.calls ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status ?? "PENDING",
        cancellable: c.cancellable ?? false,
      }));
      if (calls.length === 0) {
        clearActiveCall();
        return;
      }
      applyTableCalls(calls);
    } catch {
      // keep local state on transient errors
    }
  }, [applyTableCalls, clearActiveCall, roomNumber, tableNumber, venue.slug]);

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
    if (!tableNumber && !roomNumber) return;
    const poll = setInterval(() => {
      void syncTableStatus();
    }, 8000);
    return () => clearInterval(poll);
  }, [roomNumber, syncTableStatus, tableNumber]);

  useEffect(() => {
    const timers = resetTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
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
    return null;
  }, [tableNumber, roomNumber, ui]);

  function handleBack() {
    if (selectedItem) {
      setSelectedItem(null);
      return;
    }
    if (!isEmbedded && canGoBack) {
      window.history.back();
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backLabel(): string {
    if (selectedItem) return ui.backToMenu;
    if (canGoBack) return ui.back;
    return ui.menuTop;
  }

  function resetActionState(kind: ActionKind, delayMs = 3000) {
    const timer = setTimeout(() => {
      setActionState((s) => ({ ...s, [kind]: "idle" }));
      if (kind === "WAITER" || kind === "BILL") setCallErrorCode(null);
    }, delayMs);
    resetTimersRef.current.push(timer);
  }

  async function sendCall(type: "WAITER" | "BILL") {
    if (hasPendingType(type)) return;
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
    const line: OrderLine = {
      itemId: selectedItem.id,
      name: tr?.name ?? "—",
      quantity: itemQty,
      unitPrice: selectedItem.price.toString(),
    };
    persistCart(mergeCartLine(cartLines, line));
    setAddedFlash(true);
    const timer = setTimeout(() => {
      setAddedFlash(false);
      setSelectedItem(null);
    }, 500);
    resetTimersRef.current.push(timer);
  }

  async function sendOrder() {
    if (!canUseCallActions || cartLines.length === 0) return;
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
          orderItems: buildOrderPayload(cartLines, lang),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        type?: string;
        code?: string;
      };
      if (!res.ok) {
        setOrderState("error");
        setTimeout(() => setOrderState("idle"), 4000);
        return;
      }
      if (data.type && data.type !== "ORDER") {
        setOrderState("error");
        setTimeout(() => setOrderState("idle"), 4000);
        return;
      }
      persistCart([]);
      setOrderState("success");
      setTimeout(() => setOrderState("idle"), 3000);
      void syncTableStatus();
    } catch {
      setOrderState("error");
      setTimeout(() => setOrderState("idle"), 4000);
    }
  }

  async function cancelCall() {
    const target = cancelTarget;
    if (!target) return;
    setActionState((s) => ({ ...s, CANCEL: "loading" }));
    try {
      const res = await fetch("/api/waiter-call/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          callId: target.id,
        }),
      });
      if (!res.ok) {
        setActionState((s) => ({ ...s, CANCEL: "error" }));
        resetActionState("CANCEL", 4000);
        if (res.status === 404 || res.status === 409) {
          void syncTableStatus();
        }
        return;
      }
      setActionState((s) => ({ ...s, CANCEL: "success", WAITER: "idle", BILL: "idle" }));
      resetActionState("CANCEL");
      void syncTableStatus();
    } catch {
      setActionState((s) => ({ ...s, CANCEL: "error" }));
      resetActionState("CANCEL", 4000);
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
    if (state === "error") return ui.cancelFailed;
    if (state === "loading") return ui.cancelling;
    if (cancelTarget) return ui.cancelCallType(cancelTarget.type);
    return ui.cancelCall;
  }

  function tName(translations: { language: SupportedLanguage; name: string }[]) {
    return pickQrMenuTranslation(translations, lang)?.name ?? "—";
  }

  const hasPendingType = (type: ActiveCallType) =>
    activeCalls.some((c) => c.type === type && c.status === "PENDING");
  const hasActiveOrder = activeCalls.some((c) => c.type === "ORDER");
  const cancelTarget = activeCalls.find((c) => c.cancellable) ?? null;
  const hasCancellableCall = cancelTarget !== null;
  const canUseCallActions = Boolean(tableNumber || roomNumber);
  const cartCount = cartItemCount(cartLines);
  const cartTotalStr = cartTotal(cartLines);
  const hasCart = cartLines.length > 0;

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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
                  src={venue.logoUrl}
                  alt={venue.name}
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
                "flex items-center gap-0.5 overflow-x-auto rounded-button bg-white/10 p-1 backdrop-blur-sm",
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
          <div className={cn("relative mt-5 flex gap-2 overflow-x-auto", shell)}>
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
                <a
                  key={category.id}
                  href={`#${id}`}
                  className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-brand-blue/10"
                >
                  {tName(category.translations)}
                </a>
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => {
                  const tr = pickQrMenuTranslation(item.translations, lang);
                  return (
                    <MenuItemCard
                      key={item.id}
                      name={tr?.name ?? "—"}
                      description={tr?.description}
                      price={item.price.toString()}
                      photoUrl={item.photoUrl}
                      label={item.label}
                      lang={lang}
                      onClick={() => setSelectedItem(item)}
                    />
                  );
                })}
              </div>
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            ↑ {ui.footerHome}
          </button>
        </div>
      </footer>
      ) : null}
      </div>

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
                    ? ui.orderFailed
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
        <div className={cn(shell, "grid grid-cols-3 gap-1.5", !isEmbedded && "gap-2")}>
          <button
            type="button"
            onClick={() => void sendCall("WAITER")}
            disabled={actionState.WAITER === "loading" || hasPendingType("WAITER")}
            className={cn(
              "touch-manipulation flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-button font-semibold leading-tight",
              isEmbedded ? "py-2 text-[9px]" : "gap-1 py-3 text-[11px]",
              hasPendingType("WAITER")
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
            disabled={actionState.BILL === "loading" || hasPendingType("BILL")}
            className={cn(
              "touch-manipulation flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-button font-semibold leading-tight",
              isEmbedded ? "py-2 text-[9px]" : "gap-1 py-3 text-[11px]",
              hasPendingType("BILL")
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
            onClick={() => void cancelCall()}
            disabled={!hasCancellableCall || actionState.CANCEL === "loading"}
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
                  {selectedItem.photoUrl || isItemLabel(selectedItem.label) ? (
                    <div className="relative -mx-6 mb-4 aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      {selectedItem.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedItem.photoUrl}
                          alt={tr?.name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      {isItemLabel(selectedItem.label) ? (
                        <div className="absolute left-3 top-3">
                          <ItemLabelBadge label={selectedItem.label} lang={lang} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <h3 id="menu-item-dialog-title" className="font-serif text-2xl font-bold text-primary">
                    {tr?.name}
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-primary">€{selectedItem.price.toString()}</p>
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
                  {cartLines.map((line) => (
                    <li
                      key={line.itemId}
                      className="flex items-center justify-between gap-3 rounded-card border border-slate-100 bg-surface px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-primary">{line.name}</p>
                        <p className="text-xs text-slate-500">€{line.unitPrice}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => persistCart(updateCartLineQty(cartLines, line.itemId, line.quantity - 1))}
                          aria-label={ui.decreaseQty}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.25rem] text-center text-sm font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => persistCart(updateCartLineQty(cartLines, line.itemId, line.quantity + 1))}
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
                  ))}
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
                    {orderState === "loading" ? ui.orderSending : ui.sendOrder}
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
