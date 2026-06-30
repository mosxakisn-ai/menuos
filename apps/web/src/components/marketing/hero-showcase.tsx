"use client";

import { Bell, Globe, QrCode, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Greek Salad", nameGr: "Χωριάτικη", price: "8.50", emoji: "🥗" },
  { name: "Grilled Sea Bream", nameGr: "Τσιπούρα", price: "18.00", emoji: "🐟" },
  { name: "Mojito", nameGr: "Μοχίτο", price: "12.00", emoji: "🍹" },
];

export function HeroShowcase() {
  const [activeItem, setActiveItem] = useState(0);
  const [lang, setLang] = useState<"gr" | "en">("gr");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const itemTimer = setInterval(() => {
      setActiveItem((i) => (i + 1) % menuItems.length);
    }, 3200);
    return () => clearInterval(itemTimer);
  }, []);

  useEffect(() => {
    const scanTimer = setInterval(() => {
      setScanning((s) => !s);
    }, 2800);
    return () => clearInterval(scanTimer);
  }, []);

  useEffect(() => {
    const langTimer = setInterval(() => {
      setLang((l) => (l === "gr" ? "en" : "gr"));
    }, 6400);
    return () => clearInterval(langTimer);
  }, []);

  const item = menuItems[activeItem]!;

  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-8 top-1/4 h-48 w-48 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-4 bottom-8 h-56 w-56 rounded-full bg-brand-blue/15 blur-3xl" />

      <div className="relative grid gap-4 sm:grid-cols-[1fr_200px] sm:items-end lg:grid-cols-[1fr_220px]">
        {/* Photo scene */}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 shadow-glow ring-1 ring-slate-200/50">
          <div className="relative aspect-[4/5] sm:aspect-[5/6]">
            <Image
              src="/marketing/hero-scan-menu.jpg"
              alt="Πελάτισσα σαρώνει QR code στο τραπέζι και βλέπει το ψηφιακό menu στο κινητό"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/10 to-transparent" />

            {/* QR tent card overlay */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-auto">
              <div className="relative inline-flex items-end gap-3">
                <div className="relative rounded-xl bg-white p-2.5 shadow-xl ring-1 ring-slate-200/80">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-gradient sm:h-[72px] sm:w-[72px]">
                    <QrCode className="h-8 w-8 text-white sm:h-9 sm:w-9" strokeWidth={1.5} />
                  </div>
                  {scanning ? (
                    <div className="pointer-events-none absolute inset-2.5 overflow-hidden rounded-lg">
                      <div className="animate-scan-line absolute inset-x-0 h-0.5 bg-brand-cyan shadow-[0_0_12px_#06B6D4]" />
                    </div>
                  ) : null}
                </div>
                <div className="mb-1 hidden rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-brand-navy shadow-lg backdrop-blur sm:inline-flex sm:items-center sm:gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                  Scan · Τραπέζι 12
                </div>
              </div>
            </div>

            <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue shadow-md backdrop-blur">
              Live demo
            </div>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-[200px] sm:mx-0 lg:w-[220px]">
          <div className="animate-float relative rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 p-1.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.45)] ring-1 ring-white/10">
            <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
            <div className="overflow-hidden rounded-[1.6rem] bg-white">
              <div className="bg-brand-gradient px-3 pb-3 pt-8 text-white">
                <p className="text-[11px] font-bold leading-tight">Marine Hotel</p>
                <p className="text-[9px] text-white/75">Pool Bar · Table 12</p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-semibold"
                  >
                    <Globe className="h-2.5 w-2.5" />
                    {lang === "gr" ? "ΕΛ" : "EN"}
                  </button>
                  <span className="text-[8px] text-white/70">MenuOS</span>
                </div>
              </div>

              <div className="space-y-1.5 bg-brand-surface p-2">
                {menuItems.map((m, idx) => (
                  <div
                    key={m.nameGr}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-500 ${
                      idx === activeItem
                        ? "scale-[1.02] bg-white shadow-md ring-1 ring-brand-blue/20"
                        : "opacity-60"
                    }`}
                  >
                    <span className="text-base leading-none">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[9px] font-bold text-brand-navy">
                        {lang === "gr" ? m.nameGr : m.name}
                      </p>
                      <p className="text-[8px] font-bold text-brand-blue">€{m.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-2 mb-2 grid grid-cols-3 gap-1 text-[7px] font-bold text-white">
                <div className="flex items-center justify-center gap-0.5 rounded-lg bg-brand-gradient py-2">
                  <Bell className="h-2.5 w-2.5" />
                  {lang === "gr" ? "Σερβιτόρος" : "Waiter"}
                </div>
                <div className="flex items-center justify-center gap-0.5 rounded-lg bg-brand-blue py-2">
                  {lang === "gr" ? "Λογαρ." : "Bill"}
                </div>
                <div className="flex items-center justify-center rounded-lg border border-slate-300 bg-white py-2 text-slate-600">
                  {lang === "gr" ? "Ακύρωση" : "Cancel"}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            Χωρίς app — ανοίγει στο browser
          </p>
        </div>
      </div>
    </div>
  );
}
