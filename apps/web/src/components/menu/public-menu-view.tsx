"use client";

import { Bell, Globe } from "lucide-react";
import { useMemo, useState } from "react";
import type { SupportedLanguage } from "@menuos/db";
import { cn } from "@/lib/utils";

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

const LANGS: SupportedLanguage[] = ["GR", "EN", "DE", "FR"];

export function PublicMenuView({
  venue,
  language,
  tableNumber,
  roomNumber,
}: {
  venue: Venue;
  language: SupportedLanguage;
  tableNumber?: string;
  roomNumber?: string;
}) {
  const [lang, setLang] = useState(language);
  const [activeMenuId, setActiveMenuId] = useState(venue.menus[0]?.id);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);

  const activeMenu = venue.menus.find((m) => m.id === activeMenuId) ?? venue.menus[0];

  const locationLabel = useMemo(() => {
    if (tableNumber) return `Table ${tableNumber}`;
    if (roomNumber) return `Room ${roomNumber}`;
    return null;
  }, [tableNumber, roomNumber]);

  async function callWaiter() {
    setCalling(true);
    setCalled(false);
    try {
      const res = await fetch("/api/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueSlug: venue.slug,
          tableNumber,
          roomNumber,
        }),
      });
      if (!res.ok) return;
      setCalled(true);
      setTimeout(() => setCalled(false), 3000);
    } finally {
      setCalling(false);
    }
  }

  function tName(translations: { language: SupportedLanguage; name: string }[]) {
    return translations.find((t) => t.language === lang)?.name ?? translations[0]?.name ?? "—";
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header
        className="px-4 py-6 text-white"
        style={{ background: `linear-gradient(135deg, ${venue.primaryColor}, #121d4a)` }}
      >
        <div className="mx-auto flex max-w-lg items-start justify-between gap-4">
          <div>
            <p className="font-serif text-2xl font-bold">{venue.name}</p>
            {activeMenu ? <p className="mt-1 text-sm text-white/70">{activeMenu.name}</p> : null}
            {locationLabel ? (
              <p className="mt-2 inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs">
                {locationLabel}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 rounded-button bg-white/10 p-1">
            <Globe className="ml-1 h-4 w-4 text-white/70" />
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-semibold",
                  lang === code ? "bg-white text-primary" : "text-white/80",
                )}
              >
                {code}
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

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {!activeMenu || activeMenu.categories.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Menu coming soon.</p>
        ) : (
          activeMenu.categories.map((category) => (
            <section key={category.id}>
              <h2 className="font-serif text-xl font-bold text-primary">
                {tName(category.translations)}
              </h2>
              <div className="mt-3 space-y-3">
                {category.items.map((item) => {
                  const tr = item.translations.find((t) => t.language === lang) ?? item.translations[0];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-primary">{tr?.name}</p>
                        {tr?.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{tr.description}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 font-semibold text-primary">€{item.price.toString()}</p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <div className="fixed bottom-4 left-0 right-0 px-4">
        <button
          type="button"
          onClick={callWaiter}
          disabled={calling}
          className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 rounded-button bg-primary py-3.5 text-sm font-semibold text-white shadow-glow"
        >
          <Bell className="h-4 w-4" />
          {called ? "Waiter notified ✓" : calling ? "Calling..." : "Call Waiter"}
        </button>
      </div>

      {selectedItem ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-card bg-white p-6 sm:max-w-md sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const tr =
                selectedItem.translations.find((t) => t.language === lang) ??
                selectedItem.translations[0];
              return (
                <>
                  <h3 className="font-serif text-2xl font-bold text-primary">{tr?.name}</h3>
                  <p className="mt-2 text-lg font-semibold text-primary">
                    €{selectedItem.price.toString()}
                  </p>
                  {tr?.description ? (
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">{tr.description}</p>
                  ) : null}
                  {tr?.ingredients ? (
                    <p className="mt-3 text-xs text-slate-500">
                      <span className="font-semibold">Ingredients:</span> {tr.ingredients}
                    </p>
                  ) : null}
                  {tr?.allergens ? (
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-semibold">Allergens:</span> {tr.allergens}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="mt-6 w-full rounded-button bg-surface py-2.5 text-sm font-semibold text-primary"
                  >
                    Close
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
