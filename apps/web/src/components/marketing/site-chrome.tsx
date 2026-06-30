"use client";

import Link from "next/link";
import { demoMenuUrl } from "@menuos/shared";
import {
  ArrowRight,
  Bell,
  Clock,
  Facebook,
  Globe,
  Mail,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { useState } from "react";
import { SEO_FOOTER_HUB } from "@/lib/seo-landing";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-sm font-medium text-slate-600 transition hover:text-brand-blue";

const NAV_LINKS = [
  { href: "/sxetika", key: "about" as const },
  { href: "/ypiresies", key: "services" as const },
  { href: "/pos-leitourgei", key: "howItWorks" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/epikoinonia", key: "contact" as const },
] as const;

const HIGHLIGHT_ICONS = [Bell, Globe, Clock] as const;

const footerLinkClass =
  "text-sm text-slate-300 transition hover:text-brand-cyan";

export function SiteHeader() {
  const { m } = useI18n();
  const marketing = m.marketing;
  const [mobileOpen, setMobileOpen] = useState(false);
  const a11y = marketing.a11y;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-[4.25rem]">
        <Logo showTagline={false} markSize={36} />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <Link key={href} href={href} className={navLinkClass}>
              {marketing.nav[key]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex rounded-button p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? a11y.closeMenu : a11y.openMenu}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <LanguageSwitcher mini compact className="hidden sm:inline-flex" />
          <Link href="/login" className={`hidden sm:inline-flex ${navLinkClass}`}>
            {marketing.nav.login}
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            {marketing.nav.startFree}
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-slate-200/60 bg-white px-4 py-4 md:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-button px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-surface hover:text-brand-blue"
                >
                  {marketing.nav[key]}
                </Link>
              </li>
            ))}
            <li className="border-t border-slate-100 pt-3">
              <LanguageSwitcher mini compact className="px-3" />
            </li>
            <li className="border-t border-slate-100 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-button px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-surface"
              >
                {marketing.nav.login}
              </Link>
            </li>
            <li className="pt-2">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className={`block w-full text-center ${buttonClass("primary")}`}
              >
                {marketing.nav.startFree}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  const { m, locale } = useI18n();
  const marketing = m.marketing;
  const f = marketing.footer;
  const isEn = locale === "en";
  const demoHref = demoMenuUrl({ table: "12", siteLocale: locale });

  const highlights =
    "highlights" in f
      ? (f as { highlights: readonly { title: string; text: string }[] }).highlights
      : [];
  const cta =
    "cta" in f
      ? (f as { cta: { title: string; text: string; button: string } }).cta
      : null;
  const hub =
    "hub" in f
      ? (f as {
          hub: {
            title: string;
            localTitle: string;
            verticalTitle: string;
            description: string;
          };
        }).hub
      : null;
  const taglineSuffix = "taglineSuffix" in f ? f.taglineSuffix : null;

  return (
    <footer className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(56,189,248,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {/* Brand + highlights */}
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Logo href="/" dark markSize={40} showTagline />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-300">{f.about}</p>
            <p className="mt-4 text-xs font-medium tracking-wide text-brand-cyan/80">
              {marketing.tagline}
            </p>
          </div>

          {highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
              {highlights.map((item, i) => {
                const Icon = HIGHLIGHT_ICONS[i] ?? Bell;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:border-brand-cyan/20 hover:bg-white/[0.06]"
                  >
                    <div className="inline-flex rounded-xl bg-brand-cyan/10 p-2.5 text-brand-cyan">
                      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Link columns */}
        <div className="mt-14 grid gap-10 border-t border-white/10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {f.columns.product}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/qr-menu" className={footerLinkClass}>
                  {f.links.qrMenu}
                </Link>
              </li>
              <li>
                <Link href={demoHref} className={footerLinkClass}>
                  {f.links.demo}
                </Link>
              </li>
              <li>
                <Link href="/ypiresies" className={footerLinkClass}>
                  {f.links.services}
                </Link>
              </li>
              <li>
                <Link href="/pos-leitourgei" className={footerLinkClass}>
                  {f.links.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={footerLinkClass}>
                  {f.links.pricing}
                </Link>
              </li>
              <li>
                <Link href="/register" className={footerLinkClass}>
                  {f.links.register}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {f.columns.company}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/sxetika" className={footerLinkClass}>
                  {f.links.about}
                </Link>
              </li>
              <li>
                <Link href="/blog" className={footerLinkClass}>
                  {f.links.blog}
                </Link>
              </li>
              <li>
                <Link href="/epikoinonia" className={footerLinkClass}>
                  {f.links.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {f.columns.legal}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/terms" className={footerLinkClass}>
                  {f.links.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={footerLinkClass}>
                  {f.links.privacy}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {f.columns.contact}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`tel:${marketing.contactPhoneTel}`}
                  className={cn(footerLinkClass, "inline-flex items-center gap-2")}
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand-cyan/70" aria-hidden />
                  {marketing.contactPhone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${marketing.contactEmail}`}
                  className={cn(footerLinkClass, "inline-flex items-center gap-2")}
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand-cyan/70" aria-hidden />
                  {marketing.contactEmail}
                </a>
              </li>
              <li>
                <a
                  href={marketing.contactFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(footerLinkClass, "inline-flex items-center gap-2")}
                >
                  <Facebook className="h-3.5 w-3.5 shrink-0 text-brand-cyan/70" aria-hidden />
                  {f.links.facebook}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA band */}
        {cta ? (
          <div className="mt-14 rounded-2xl border border-brand-cyan/20 bg-gradient-to-br from-brand-blue/20 via-white/[0.06] to-brand-cyan/10 p-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-10">
            <div className="max-w-xl">
              <p className="text-lg font-bold text-white sm:text-xl">{cta.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{cta.text}</p>
            </div>
            <Link
              href="/register"
              className={cn(
                buttonClass("primary", "lg"),
                "mt-6 inline-flex shrink-0 items-center gap-2 sm:mt-0",
              )}
            >
              {cta.button}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}

        {/* SEO hub — crawlable, visually hidden */}
        <nav className="sr-only" aria-label={isEn ? "Site guides" : "Οδηγοί ιστοτόπου"}>
          {hub ? <p>{hub.description}</p> : null}
          <ul>
            {SEO_FOOTER_HUB.local.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{isEn ? link.labelEn : link.labelEl}</Link>
              </li>
            ))}
            {SEO_FOOTER_HUB.verticals.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{isEn ? link.labelEn : link.labelEl}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} MenuOS. {f.rights}
          </p>
          {taglineSuffix ? <p className="text-center text-xs text-slate-500 sm:text-right">{taglineSuffix}</p> : null}
        </div>
      </div>
    </footer>
  );
}
