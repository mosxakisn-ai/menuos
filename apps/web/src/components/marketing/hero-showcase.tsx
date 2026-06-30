"use client";

import { Bell, Check, Globe, QrCode, Receipt, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ItemLabel, QrMenuLanguage } from "@menuos/shared";
import { QR_MENU_UI } from "@menuos/shared";
import { LogoMark } from "@/components/brand/logo-mark";
import { ItemLabelBadge } from "@/components/menu/menu-item-card";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

type DemoStep = "menu" | "detail" | "waiter";

type DemoItem = {
  id: string;
  nameGr: string;
  nameEn: string;
  nameDe?: string;
  nameFr?: string;
  price: string;
  descriptionGr: string;
  descriptionEn: string;
  descriptionDe?: string;
  descriptionFr?: string;
  label: ItemLabel | null;
  gradient: string;
  emoji: string;
};

type DemoCategory = {
  id: string;
  nameGr: string;
  nameEn: string;
  nameDe?: string;
  nameFr?: string;
  items: DemoItem[];
};

const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: "salads",
    nameGr: "Σαλάτες",
    nameEn: "Salads",
    nameDe: "Salate",
    nameFr: "Salades",
    items: [
      {
        id: "salad",
        nameGr: "Χωριάτικη",
        nameEn: "Greek Salad",
        price: "8.50",
        descriptionGr: "Ντομάτα, αγγούρι, φέτα, ελιές, ρίγανη.",
        descriptionEn: "Tomato, cucumber, feta, olives, oregano.",
        label: "OFFER",
        gradient: "from-emerald-100 to-green-200",
        emoji: "🥗",
      },
      {
        id: "rocket",
        nameGr: "Ρόκα",
        nameEn: "Rocket Salad",
        price: "7.00",
        descriptionGr: "Ρόκα, παρμεζάνα, λεμόνι.",
        descriptionEn: "Rocket, parmesan, lemon.",
        label: null,
        gradient: "from-lime-50 to-emerald-100",
        emoji: "🥬",
      },
    ],
  },
  {
    id: "fish",
    nameGr: "Ψάρια",
    nameEn: "Fish",
    nameDe: "Fisch",
    nameFr: "Poissons",
    items: [
      {
        id: "bream",
        nameGr: "Τσιπούρα",
        nameEn: "Sea Bream",
        nameDe: "Goldbrasse",
        nameFr: "Daurade",
        price: "18.00",
        descriptionGr: "Ψητή στο φούρνο με λεμόνι και ελαιόλαδο.",
        descriptionEn: "Oven-grilled with lemon and olive oil.",
        descriptionDe: "Im Ofen mit Zitrone und Olivenöl.",
        descriptionFr: "Grillée au four, citron et huile d'olive.",
        label: "BEST",
        gradient: "from-sky-100 to-blue-200",
        emoji: "🐟",
      },
      {
        id: "octopus",
        nameGr: "Χταπόδι",
        nameEn: "Octopus",
        price: "16.00",
        descriptionGr: "Ψητό με fennel και κρασί.",
        descriptionEn: "Grilled with fennel and wine.",
        label: null,
        gradient: "from-violet-100 to-purple-200",
        emoji: "🐙",
      },
    ],
  },
  {
    id: "drinks",
    nameGr: "Ποτά",
    nameEn: "Drinks",
    nameDe: "Getränke",
    nameFr: "Boissons",
    items: [
      {
        id: "mojito",
        nameGr: "Μοχίτο",
        nameEn: "Mojito",
        nameDe: "Mojito",
        nameFr: "Mojito",
        price: "12.00",
        descriptionGr: "Ρούμι, μέντα, λάιμ, σόδα.",
        descriptionEn: "Rum, mint, lime, soda.",
        label: "NEW",
        gradient: "from-cyan-100 to-teal-200",
        emoji: "🍹",
      },
    ],
  },
];

const DETAIL_ITEM = DEMO_CATEGORIES[1]!.items[0]!;
const STEP_LABELS: Record<QrMenuLanguage, readonly string[]> = {
  GR: ["Κατηγορίες", "Πιάτο", "Κλήση"],
  EN: ["Categories", "Dish", "Call"],
  DE: ["Kategorien", "Gericht", "Anruf"],
  FR: ["Catégories", "Plat", "Appel"],
};

const LANGS: QrMenuLanguage[] = ["GR", "EN", "DE", "FR"];

function demoText(
  item: DemoItem,
  lang: QrMenuLanguage,
  field: "name" | "description",
): string {
  if (field === "name") {
    if (lang === "GR") return item.nameGr;
    if (lang === "DE") return item.nameDe ?? item.nameEn;
    if (lang === "FR") return item.nameFr ?? item.nameEn;
    return item.nameEn;
  }
  if (lang === "GR") return item.descriptionGr;
  if (lang === "DE") return item.descriptionDe ?? item.descriptionEn;
  if (lang === "FR") return item.descriptionFr ?? item.descriptionEn;
  return item.descriptionEn;
}

function demoCategoryName(cat: DemoCategory, lang: QrMenuLanguage): string {
  if (lang === "GR") return cat.nameGr;
  if (lang === "DE") return cat.nameDe ?? cat.nameEn;
  if (lang === "FR") return cat.nameFr ?? cat.nameEn;
  return cat.nameEn;
}

function DemoMenuCard({
  item,
  lang,
  highlighted,
}: {
  item: DemoItem;
  lang: QrMenuLanguage;
  highlighted?: boolean;
}) {
  const name = demoText(item, lang, "name");
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] bg-white text-left shadow-soft transition-all duration-500",
        highlighted && "scale-[1.03] shadow-card ring-2 ring-brand-blue/40",
      )}
    >
      <div className={cn("relative aspect-[16/10] bg-gradient-to-br", item.gradient)}>
        <div className="flex h-full items-center justify-center text-2xl">{item.emoji}</div>
        {item.label ? (
          <div className="absolute left-1.5 top-1.5">
            <ItemLabelBadge label={item.label} lang={lang} className="px-1.5 py-px text-[8px]" />
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-1 p-2">
        <p className="line-clamp-1 text-[10px] font-semibold leading-tight text-primary">{name}</p>
        <p className="shrink-0 text-[10px] font-bold text-brand-blue">€{item.price}</p>
      </div>
    </div>
  );
}

function PhoneScreen({
  step,
  lang,
  menuScroll,
  waiterSuccess,
  venueName,
  venueSubtitle,
}: {
  step: DemoStep;
  lang: QrMenuLanguage;
  menuScroll: number;
  waiterSuccess: boolean;
  venueName: string;
  venueSubtitle: string;
}) {
  const ui = QR_MENU_UI[lang];
  const detailName = demoText(DETAIL_ITEM, lang, "name");
  const detailDesc = demoText(DETAIL_ITEM, lang, "description");

  return (
    <div className="relative flex h-full flex-col bg-surface">
      {/* Header — matches public QR menu */}
      <header className="shrink-0 bg-brand-gradient px-3 pb-3 pt-7 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-[15px] font-bold leading-tight">{venueName}</p>
            <p className="mt-0.5 text-[10px] text-white/75">{venueSubtitle}</p>
            <p className="mt-1.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[9px]">
              {ui.table("12")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-[8px] bg-white/10 p-0.5">
            <Globe className="ml-0.5 h-3 w-3 text-white/70" aria-hidden />
            {LANGS.map((code) => (
              <span
                key={code}
                className={cn(
                  "min-w-[1.4rem] rounded px-1 py-0.5 text-center text-[8px] font-bold",
                  lang === code ? "bg-white text-primary" : "text-white/75",
                )}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Scrollable menu */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="space-y-4 px-2.5 py-3 transition-transform duration-[1800ms] ease-in-out"
          style={{ transform: `translateY(-${menuScroll}px)` }}
        >
          {DEMO_CATEGORIES.map((cat) => (
            <section key={cat.id}>
              <h2 className="font-serif text-[13px] font-bold text-primary">
                {demoCategoryName(cat, lang)}
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {cat.items.map((item) => (
                  <DemoMenuCard
                    key={item.id}
                    item={item}
                    lang={lang}
                    highlighted={step === "detail" && item.id === DETAIL_ITEM.id}
                  />
                ))}
              </div>
            </section>
          ))}

          <div className="flex items-center justify-center gap-1.5 pb-1 pt-1 text-[9px] text-slate-400">
            <LogoMark size={14} />
            <span>
              <span className="font-extrabold text-brand-navy">Menu</span>
              <span className="font-extrabold text-brand-blue">Os</span>
            </span>
          </div>
        </div>

        {/* Item detail overlay */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-end bg-black/40 transition-opacity duration-500",
            step === "detail" ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <div
            className={cn(
              "w-full rounded-t-[14px] bg-white p-3 shadow-2xl transition-transform duration-500",
              step === "detail" ? "translate-y-0" : "translate-y-full",
            )}
          >
            <div className="relative -mx-3 -mt-3 mb-2 aspect-[16/10] overflow-hidden bg-gradient-to-br from-sky-100 to-blue-200">
              <div className="flex h-full items-center justify-center text-4xl">{DETAIL_ITEM.emoji}</div>
              {DETAIL_ITEM.label ? (
                <div className="absolute left-2 top-2">
                  <ItemLabelBadge label={DETAIL_ITEM.label} lang={lang} className="text-[8px]" />
                </div>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-[15px] font-bold text-primary">{detailName}</h3>
              <button type="button" className="rounded-full p-0.5 text-slate-400" aria-hidden>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-600">{detailDesc}</p>
            <p className="mt-2 text-[13px] font-bold text-brand-blue">€{DETAIL_ITEM.price}</p>
          </div>
        </div>
      </div>

      {/* Waiter bar — matches public menu */}
      <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-2 pb-2 pt-2 backdrop-blur">
        <div className="grid grid-cols-3 gap-1.5">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-[8px] py-2 text-[8px] font-semibold leading-tight transition-all duration-500",
              waiterSuccess
                ? "bg-emerald-600 text-white"
                : step === "waiter"
                  ? "scale-[1.02] bg-primary text-white shadow-glow ring-2 ring-brand-cyan/50"
                  : "bg-primary text-white",
            )}
          >
            {waiterSuccess ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            <span>{waiterSuccess ? ui.calledShort : ui.callWaiterShort}</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-0.5 rounded-[8px] border border-slate-200 bg-white py-2 text-[8px] font-semibold text-slate-600">
            <Receipt className="h-3.5 w-3.5" />
            <span>{ui.requestBill}</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-[8px] border border-slate-200 bg-white py-2 text-[8px] font-semibold text-slate-500">
            {ui.cancelCall}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroShowcase() {
  const { m } = useI18n();
  const hs = m.marketing.home.heroShowcase;
  const [step, setStep] = useState<DemoStep>("menu");
  const [lang, setLang] = useState<QrMenuLanguage>("GR");
  const [menuScroll, setMenuScroll] = useState(0);
  const [waiterSuccess, setWaiterSuccess] = useState(false);
  const [scanning, setScanning] = useState(true);

  const stepIndex = useMemo(() => (step === "menu" ? 0 : step === "detail" ? 1 : 2), [step]);
  const stepLabels = STEP_LABELS[lang];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setScanning(false);
      return;
    }
    const scanTimer = setInterval(() => setScanning((s) => !s), 2800);
    return () => clearInterval(scanTimer);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function runCycle() {
      if (cancelled) return;

      setStep("menu");
      setMenuScroll(0);
      setWaiterSuccess(false);
      setLang("GR");

      timers.push(
        setTimeout(() => {
          if (!cancelled) setMenuScroll(72);
        }, 2200),
      );

      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setStep("detail");
            setLang("EN");
          }
        }, 4200),
      );

      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setStep("waiter");
            setLang("DE");
          }
        }, 7600),
      );

      timers.push(
        setTimeout(() => {
          if (!cancelled) setWaiterSuccess(true);
        }, 8200),
      );

      timers.push(
        setTimeout(() => {
          if (!cancelled) runCycle();
        }, 11200),
      );
    }

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="pointer-events-none absolute -left-8 top-1/4 h-48 w-48 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-4 bottom-8 h-56 w-56 rounded-full bg-brand-blue/15 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-end lg:gap-10 xl:gap-14">
        {/* Photo scene */}
        <div className="relative w-full max-w-[420px] lg:max-w-[440px] lg:flex-1">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 shadow-glow ring-1 ring-slate-200/50">
            <div className="relative aspect-[4/5] sm:aspect-[5/6]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.2)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80')",
                }}
                role="img"
                aria-label={hs.photoAlt}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-brand-navy/10 to-transparent" />

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
                    {hs.scanBadge}
                  </div>
                </div>
              </div>

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 shadow-md backdrop-blur">
                <LogoMark size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy">{hs.liveDemo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phone mockup — realistic size */}
        <div className="relative w-full max-w-[320px] shrink-0 sm:max-w-[340px]">
          <div className="mb-4 flex items-center justify-center gap-2">
            {stepLabels.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors duration-300",
                    stepIndex === idx
                      ? "bg-brand-gradient text-white shadow-soft"
                      : stepIndex > idx
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-white text-slate-400 ring-1 ring-slate-200",
                  )}
                >
                  {idx + 1}. {label}
                </span>
                {idx < stepLabels.length - 1 ? (
                  <span className="hidden text-slate-300 sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="animate-float relative mx-auto w-[280px] sm:w-[300px]">
            <div className="relative rounded-[2.75rem] border-[5px] border-slate-900 bg-slate-900 p-2 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.55)] ring-1 ring-white/10">
              <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-slate-900" />
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.2rem] bg-white">
                <PhoneScreen
                  step={step}
                  lang={lang}
                  menuScroll={menuScroll}
                  waiterSuccess={waiterSuccess}
                  venueName={hs.venueName}
                  venueSubtitle={hs.venueSubtitle} />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <LogoMark size={20} />
              <span>
                {hs.noAppPrefix}{" "}
                <span className="font-extrabold text-brand-navy">Menu</span>
                <span className="font-extrabold text-brand-blue">Os</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
