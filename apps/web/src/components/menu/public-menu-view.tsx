"use client";

import { Bell, Globe, Receipt, UtensilsCrossed, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupportedLanguage } from "@menuos/db";
import {
  QR_MENU_LANGUAGE_LABELS,
  QR_MENU_LANGUAGES,
  QR_MENU_UI,
  pickQrMenuTranslation,
  type QrMenuLanguage,
} from "@menuos/shared";
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

function callStorageKey(venueSlug: string, tableNumber?: string, roomNumber?: string) {
  return `menuos-call:${venueSlug}:${tableNumber ?? ""}:${roomNumber ?? ""}`;
}

export function PublicMenuView({
  venue,
  language,
  tableNumber,
  roomNumber,
}: {
  venue: Venue;
  language: QrMenuLanguage;
  tableNumber?: string;
  roomNumber?: string;
}) {
  const [lang, setLang] = useState<QrMenuLanguage>(language);
  const [activeMenuId, setActiveMenuId] = useState(venue.menus[0]?.id);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<ActionKind, ActionState>>({
    WAITER: "idle",
    BILL: "idle",
    CANCEL: "idle",
  });
  const [callErrorCode, setCallErrorCode] = useState<CallErrorCode | null>(null);
  const resetTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  const ui = QR_MENU_UI[lang];
  const activeMenu = venue.menus.find((m) => m.id === activeMenuId) ?? venue.menus[0];
  const storageKey = useMemo(
    () => callStorageKey(venue.slug, tableNumber, roomNumber),
    [venue.slug, tableNumber, roomNumber],
  );

  const syncCallStatus = useCallback(
    async (callId: string) => {
      try {
        const res = await fetch(
          `/api/waiter-call/status?callId=${encodeURIComponent(callId)}&venueSlug=${encodeURIComponent(venue.slug)}`,
        );
        if (!res.ok) {
          sessionStorage.removeItem(storageKey);
          setActiveCallId(null);
          return false;
        }
        const data = (await res.json()) as { active?: boolean };
        if (data.active) {
          setActiveCallId(callId);
          return true;
        }
        sessionStorage.removeItem(storageKey);
        setActiveCallId(null);
        return false;
      } catch {
        return false;
      }
    },
    [storageKey, venue.slug],
  );

  const restoreActiveCall = useCallback(async () => {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return;
    await syncCallStatus(stored);
  }, [storageKey, syncCallStatus]);

  useEffect(() => {
    void restoreActiveCall();
  }, [restoreActiveCall]);

  useEffect(() => {
    if (!activeCallId) return;
    const poll = setInterval(() => {
      void syncCallStatus(activeCallId);
    }, 8000);
    return () => clearInterval(poll);
  }, [activeCallId, syncCallStatus]);

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

  function resetActionState(kind: ActionKind, delayMs = 3000) {
    const timer = setTimeout(() => {
      setActionState((s) => ({ ...s, [kind]: "idle" }));
      if (kind === "WAITER" || kind === "BILL") setCallErrorCode(null);
    }, delayMs);
    resetTimersRef.current.push(timer);
  }

  async function sendCall(type: "WAITER" | "BILL") {
    if (activeCallId) return;
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
      const data = (await res.json().catch(() => ({}))) as { id?: string; code?: string };
      if (!res.ok) {
        setCallErrorCode(data.code === "rate_limited" ? "rate_limited" : "generic");
        setActionState((s) => ({ ...s, [type]: "error" }));
        resetActionState(type, 4000);
        return;
      }
      if (data.id) {
        setActiveCallId(data.id);
        sessionStorage.setItem(storageKey, data.id);
      }
      setActionState((s) => ({ ...s, [type]: "success" }));
      resetActionState(type);
    } catch {
      setActionState((s) => ({ ...s, [type]: "error" }));
      resetActionState(type, 4000);
    }
  }

  async function cancelCall() {
    if (!activeCallId) return;
    setActionState((s) => ({ ...s, CANCEL: "loading" }));
    try {
      const res = await fetch("/api/waiter-call/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          callId: activeCallId,
        }),
      });
      if (!res.ok) {
        setActionState((s) => ({ ...s, CANCEL: "error" }));
        resetActionState("CANCEL", 4000);
        if (res.status === 404 || res.status === 409) {
          setActiveCallId(null);
          sessionStorage.removeItem(storageKey);
        }
        return;
      }
      setActiveCallId(null);
      sessionStorage.removeItem(storageKey);
      setActionState((s) => ({ ...s, CANCEL: "success", WAITER: "idle", BILL: "idle" }));
      resetActionState("CANCEL");
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
    return ui.cancelCall;
  }

  function tName(translations: { language: SupportedLanguage; name: string }[]) {
    return pickQrMenuTranslation(translations, lang)?.name ?? "—";
  }

  const hasPendingCall = Boolean(activeCallId);

  const categoryNav = activeMenu?.categories ?? [];

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header
        className="px-4 py-6 text-white"
        style={{ background: `linear-gradient(135deg, ${venue.primaryColor}, #121d4a)` }}
      >
        <div className="mx-auto flex max-w-lg items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {venue.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venue.logoUrl}
                alt={venue.name}
                className="mt-0.5 h-12 w-12 shrink-0 rounded-full border-2 border-white/30 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                <UtensilsCrossed className="h-6 w-6 text-white/90" aria-hidden />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-serif text-2xl font-bold leading-tight">{venue.name}</p>
              {activeMenu ? <p className="mt-1 text-sm text-white/70">{activeMenu.name}</p> : null}
              {locationLabel ? (
                <p className="mt-2 inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs">
                  {locationLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div
            className="flex max-w-[11rem] shrink-0 items-center gap-0.5 overflow-x-auto rounded-button bg-white/10 p-1"
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
        {venue.menus.length > 1 ? (
          <div className="mx-auto mt-4 flex max-w-lg gap-2 overflow-x-auto">
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
        <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto px-4 py-2">
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

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {!activeMenu || activeMenu.categories.length === 0 ? (
          <p className="text-center text-sm text-slate-500">{ui.menuSoon}</p>
        ) : (
          activeMenu.categories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-16">
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

      <p className="pb-28 text-center text-[10px] text-slate-400">
        {ui.poweredBy}{" "}
        <a href="https://menuos.gr" className="font-medium text-slate-500 hover:text-brand-blue">
          MenuOS
        </a>
      </p>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200/80 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => sendCall("WAITER")}
            disabled={actionState.WAITER === "loading" || hasPendingCall}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-button py-3 text-[11px] font-semibold leading-tight",
              hasPendingCall
                ? "bg-slate-100 text-slate-400"
                : "bg-primary text-white shadow-glow",
              actionState.WAITER === "success" && "bg-emerald-600 text-white",
              actionState.WAITER === "error" && "bg-red-600 text-white",
            )}
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-center">{buttonLabel("WAITER")}</span>
          </button>
          <button
            type="button"
            onClick={() => sendCall("BILL")}
            disabled={actionState.BILL === "loading" || hasPendingCall}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-button py-3 text-[11px] font-semibold leading-tight",
              hasPendingCall
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-blue text-white",
              actionState.BILL === "success" && "bg-emerald-600 text-white",
              actionState.BILL === "error" && "bg-red-600 text-white",
            )}
          >
            <Receipt className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-center">{buttonLabel("BILL")}</span>
          </button>
          <button
            type="button"
            onClick={cancelCall}
            disabled={!hasPendingCall || actionState.CANCEL === "loading"}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-button border py-3 text-[11px] font-semibold leading-tight",
              hasPendingCall
                ? "border-slate-300 bg-white text-slate-700"
                : "border-slate-200 bg-slate-50 text-slate-400",
              actionState.CANCEL === "success" && "border-emerald-300 bg-emerald-50 text-emerald-800",
              actionState.CANCEL === "error" && "border-red-300 bg-red-50 text-red-800",
            )}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-center">{buttonLabel("CANCEL")}</span>
          </button>
        </div>
      </div>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center"
          onClick={() => setSelectedItem(null)}
          role="presentation"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-dialog-title"
            tabIndex={-1}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-card bg-white p-6 sm:max-w-md sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const tr = pickQrMenuTranslation(selectedItem.translations, lang);
              return (
                <>
                  {selectedItem.photoUrl || isItemLabel(selectedItem.label) ? (
                    <div className="relative -mx-6 -mt-6 mb-4 aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
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
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="mt-6 w-full rounded-button bg-surface py-2.5 text-sm font-semibold text-primary"
                  >
                    {ui.close}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
