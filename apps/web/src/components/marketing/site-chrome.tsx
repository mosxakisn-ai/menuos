"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useDemoMenuUrl } from "@/lib/demo-menu-url";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { buttonClass } from "@/components/ui/button";
import { useI18n } from "@/i18n/context";

const navLinkClass =
  "text-sm font-medium text-slate-600 transition hover:text-brand-blue";

const NAV_LINKS = [
  { href: "/sxetika", key: "about" as const },
  { href: "/ypiresies", key: "services" as const },
  { href: "/pos-leitourgei", key: "howItWorks" as const },
  { href: "/pricing", key: "pricing" as const },
  { href: "/epikoinonia", key: "contact" as const },
] as const;

export function SiteHeader() {
  const { m } = useI18n();
  const marketing = m.marketing;
  const demoUrl = useDemoMenuUrl();
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
          <Link href={demoUrl} className={navLinkClass}>
            {marketing.nav.demo}
          </Link>
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
            <li>
              <Link
                href={demoUrl}
                onClick={() => setMobileOpen(false)}
                className="block rounded-button px-3 py-2.5 text-sm font-medium text-brand-blue hover:bg-brand-surface"
              >
                {marketing.nav.demo}
              </Link>
            </li>
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
  const { m } = useI18n();
  const marketing = m.marketing;
  const f = marketing.footer;
  const demoUrl = useDemoMenuUrl();
  const taglineSuffix =
    "taglineSuffix" in f ? (f as { taglineSuffix: string }).taglineSuffix : null;

  return (
    <footer className="border-t border-slate-200 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo href="/" dark markSize={36} showTagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">{f.about}</p>
            <p className="mt-4 text-xs text-slate-400">{marketing.tagline}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{f.columns.product}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li><Link href="/qr-menu" className="hover:text-brand-cyan">{f.links.qrMenu}</Link></li>
              <li><Link href={demoUrl} className="hover:text-brand-cyan">{f.links.demo}</Link></li>
              <li><Link href="/ypiresies" className="hover:text-brand-cyan">{f.links.services}</Link></li>
              <li><Link href="/pos-leitourgei" className="hover:text-brand-cyan">{f.links.howItWorks}</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-cyan">{f.links.pricing}</Link></li>
              <li><Link href="/register" className="hover:text-brand-cyan">{f.links.register}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{f.columns.company}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li><Link href="/sxetika" className="hover:text-brand-cyan">{f.links.about}</Link></li>
              <li><Link href="/epikoinonia" className="hover:text-brand-cyan">{f.links.contact}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{f.columns.legal}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li><Link href="/terms" className="hover:text-brand-cyan">{f.links.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-cyan">{f.links.privacy}</Link></li>
            </ul>
            <p className="mt-6 text-sm font-semibold text-white">{f.columns.contact}</p>
            <p className="mt-2 text-sm text-slate-300">
              <a href={`tel:${marketing.contactPhoneTel}`} className="hover:text-brand-cyan">
                {marketing.contactPhone}
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              <a href={`mailto:${marketing.contactEmail}`} className="hover:text-brand-cyan">
                {marketing.contactEmail}
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              <a
                href={marketing.contactFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-cyan"
              >
                {f.links.facebook}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MenuOS. {f.rights}
          </p>
          {taglineSuffix ? (
            <p className="text-xs text-slate-500">{taglineSuffix}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
