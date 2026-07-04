"use client";

import Image from "next/image";
import { Sparkles, Wifi } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoMenuUrl } from "@menuos/shared";
import { DemoTavernaLogo } from "@/components/marketing/demo-taverna-logo";
import { HeroQrCode } from "@/components/marketing/hero-qr-code";
import { Logo } from "@/components/brand/logo";
import { APP_URL } from "@/lib/config";
import { optimizeCoverPhotoUrl } from "@/lib/menu-photo-url";
import { HERO_SHOWCASE_SHELL_CLASS } from "@/components/marketing/hero-showcase-shell";
import { useI18n } from "@/i18n/context";

const PHOTOS = {
  /** Mediterranean terrace dining — lifestyle card max ~440px wide */
  taverna: optimizeCoverPhotoUrl(
    "https://images.unsplash.com/photo-1559339352-11d035aa65de",
    460,
  ),
  /** Guest scanning phone at table — overlay ~128px */
  guest: optimizeCoverPhotoUrl(
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d",
    128,
  ),
  /** Greek/Mediterranean dish close-up — overlay ~96px */
  food: optimizeCoverPhotoUrl(
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
    96,
  ),
} as const;

function PhoneStatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-11 bg-gradient-to-b from-white via-white to-white/80">
      <div className="flex h-full items-center justify-between px-5 pt-1.5 text-[10px] font-semibold text-slate-900">
        <span>9:41</span>
        <span className="w-[76px]" aria-hidden />
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            <span className="h-2 w-0.5 rounded-full bg-slate-900" />
            <span className="h-2.5 w-0.5 rounded-full bg-slate-900" />
            <span className="h-3 w-0.5 rounded-full bg-slate-900" />
            <span className="h-3.5 w-0.5 rounded-full bg-slate-900" />
          </div>
          <Wifi className="h-3 w-3" strokeWidth={2.5} />
          <div className="ml-0.5 h-2.5 w-5 rounded-sm border border-slate-900 p-px">
            <div className="h-full w-3/4 rounded-[1px] bg-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroShowcase() {
  const { m, locale } = useI18n();
  const hs = m.marketing.home.heroShowcase;
  const [scanning, setScanning] = useState(true);
  const [qrOrigin, setQrOrigin] = useState(APP_URL);
  const [demoIframeSrc, setDemoIframeSrc] = useState<string | null>(null);
  const demoIframeHostRef = useRef<HTMLDivElement>(null);

  const demoMenuIframePath = useMemo(
    () => demoMenuUrl({ table: "12", siteLocale: locale, embed: true }),
    [locale],
  );

  useEffect(() => {
    const host = demoIframeHostRef.current;
    if (!host) return;

    const loadIframe = () => setDemoIframeSrc(demoMenuIframePath);

    const scheduleLoad = () => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(loadIframe, { timeout: 2500 });
      } else {
        window.setTimeout(loadIframe, 600);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      scheduleLoad();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          scheduleLoad();
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [demoMenuIframePath]);

  useEffect(() => {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      setQrOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setScanning(false);
      return;
    }
    const scanTimer = setInterval(() => setScanning((s) => !s), 2800);
    return () => clearInterval(scanTimer);
  }, []);

  const demoMenuQrUrl = useMemo(
    () => `${qrOrigin}${demoMenuUrl({ table: "12", siteLocale: locale })}`,
    [qrOrigin, locale],
  );

  return (
    <div className={`relative ${HERO_SHOWCASE_SHELL_CLASS}`}>
      <div className="pointer-events-none absolute -left-8 top-1/4 h-48 w-48 rounded-full bg-brand-cyan/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-4 bottom-8 h-56 w-56 rounded-full bg-brand-blue/15 blur-3xl" />

      <div className="mb-4 flex flex-wrap justify-center gap-1.5 lg:justify-end">
        {hs.venueTypes.map((vt) => (
          <span
            key={vt}
            className="rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-soft backdrop-blur-sm"
          >
            {vt}
          </span>
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-end lg:gap-10 xl:gap-14">
        {/* Phone mockup — πρώτο στο mobile (ζωντανό demo) */}
        <div className="relative order-1 w-full max-w-[320px] shrink-0 sm:max-w-[340px] lg:order-2">
          <div className="mb-3 flex justify-center lg:hidden">
            <span className="inline-flex rounded-full bg-brand-gradient px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
              {hs.liveDemo}
            </span>
          </div>
          <div className="mx-auto max-w-[18rem] text-center sm:max-w-xs">
            <p className="text-sm font-medium leading-snug text-slate-700">{hs.liveDemoHint}</p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-brand-blue">{hs.liveDemoTouchpoints}</p>
          </div>
          <p className="mb-4 mt-3 text-center">
            <span className="inline-flex rounded-full border border-brand-blue/20 bg-brand-blue/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-blue">
              {hs.demoExampleLabel}
            </span>
          </p>

          <div className="relative mx-auto w-[min(100%,280px)] sm:w-[300px]">
            <div className="relative rounded-[2.75rem] border-[5px] border-slate-900 bg-slate-900 p-2 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.55)] ring-1 ring-white/10">
              <div className="absolute -left-[3px] top-24 h-8 w-[3px] rounded-l-sm bg-slate-800" />
              <div className="absolute -left-[3px] top-36 h-12 w-[3px] rounded-l-sm bg-slate-800" />
              <div className="absolute -left-[3px] top-52 h-12 w-[3px] rounded-l-sm bg-slate-800" />
              <div className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r-sm bg-slate-800" />

              <div className="absolute left-1/2 top-2.5 z-40 h-[22px] w-[76px] -translate-x-1/2 rounded-full bg-slate-900" />

              <div className="relative isolate aspect-[9/19.5] overflow-hidden rounded-[2.2rem] bg-white">
                <PhoneStatusBar />
                <div
                  ref={demoIframeHostRef}
                  className="absolute inset-x-0 bottom-3 top-10 overflow-hidden bg-white"
                >
                  {demoIframeSrc ? (
                    <iframe
                      src={demoIframeSrc}
                      title={`${hs.venueName} — ${hs.venueSubtitle}`}
                      className="block h-full w-full max-w-full touch-pan-y border-0 bg-white"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <div className="flex h-full flex-col gap-3 p-3" aria-hidden>
                      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-100" />
                      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
                  <div className="h-1 w-[5.5rem] rounded-full bg-slate-900/80" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              <DemoTavernaLogo showName size={36} tagline={`${hs.demoExampleLabel} · ${hs.venueTagline}`} />
              <p className="text-center text-xs text-slate-500">
                {hs.noAppPrefix}{" "}
                <span className="font-extrabold text-brand-navy">Menu</span>
                <span className="font-extrabold text-brand-blue">Os</span>
              </p>
            </div>
          </div>
        </div>

        {/* Lifestyle scene — QR table tent (δεύτερο στο mobile) */}
        <div className="relative order-2 w-full max-w-[440px] lg:order-1 lg:max-w-[460px] lg:flex-1">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 shadow-glow ring-1 ring-slate-200/50">
            <div className="relative aspect-[4/5] sm:aspect-[5/6]">
              <Image
                src={PHOTOS.taverna}
                alt={hs.photoAlt}
                fill
                quality={52}
                sizes="(max-width: 1024px) 440px, 460px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/25 to-brand-navy/10" />

              <div className="absolute left-4 top-4 z-10 rounded-2xl bg-white/95 p-2 shadow-lg backdrop-blur-sm ring-1 ring-white/80">
                <Logo href={false} markSize={28} />
              </div>

              <div className="absolute right-4 top-4 z-10 overflow-hidden rounded-2xl border-2 border-white/90 shadow-xl ring-1 ring-black/5">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  <Image
                    src={PHOTOS.food}
                    alt={hs.foodAlt}
                    fill
                    quality={60}
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="absolute right-4 top-[5.5rem] z-10 hidden overflow-hidden rounded-2xl border-2 border-white/90 shadow-xl ring-1 ring-black/5 sm:block sm:top-[6.5rem]">
                <div className="relative h-24 w-32">
                  <Image
                    src={PHOTOS.guest}
                    alt={hs.guestAlt}
                    fill
                    quality={60}
                    sizes="128px"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent" />
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 z-10 w-[calc(100%-2rem)] max-w-[240px] -translate-x-1/2 sm:bottom-8 sm:left-6 sm:w-auto sm:translate-x-0">
                <div
                  className="relative mx-auto max-w-[240px] origin-bottom sm:origin-bottom-left"
                  style={{ transform: "perspective(800px) rotateY(-6deg) rotateX(2deg)" }}
                >
                  <div className="rounded-2xl bg-white p-4 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80">
                    <DemoTavernaLogo showName size={40} tagline={hs.venueTagline} />

                    <div className="mt-3 flex items-start gap-3">
                      <div className="relative shrink-0 rounded-lg bg-white p-1 ring-1 ring-slate-100">
                        <HeroQrCode
                          url={demoMenuQrUrl}
                          size={72}
                          color="#1e3a5f"
                          alt={hs.qrAlt}
                        />
                        {scanning ? (
                          <div className="pointer-events-none absolute inset-1 overflow-hidden rounded-md">
                            <div className="animate-scan-line absolute inset-0 will-change-transform">
                              <div className="h-0.5 w-full bg-brand-cyan shadow-[0_0_10px_#06B6D4]" />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[11px] font-bold leading-snug text-brand-navy">
                          {hs.tableTentTitle}
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                          {hs.tableTentBody}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-brand-navy">
                          <Sparkles className="h-3 w-3 text-brand-cyan" />
                          {hs.scanBadge}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                        {hs.poweredBy}
                      </span>
                      <Logo href={false} markSize={16} className="scale-90 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-4 z-10 hidden rounded-full bg-brand-gradient px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg sm:bottom-8 lg:block">
                {hs.liveDemo}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
