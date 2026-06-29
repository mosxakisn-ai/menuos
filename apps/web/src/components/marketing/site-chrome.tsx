import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";
import { MARKETING } from "@/content/marketing-el";

const m = MARKETING;
const f = m.footer;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo showTagline={false} markSize={36} />
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/ypiresies" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            {m.nav.services}
          </Link>
          <Link href="/pos-leitourgei" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            {m.nav.howItWorks}
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            {m.nav.pricing}
          </Link>
          <Link href="/sxetika" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            {m.nav.about}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            {m.nav.login}
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            {m.nav.startFree}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-brand-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo href="/" dark markSize={36} showTagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">{f.about}</p>
            <p className="mt-4 text-xs text-slate-400">{m.tagline}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{f.columns.product}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
              <li><Link href="/qr-menu" className="hover:text-brand-cyan">{f.links.qrMenu}</Link></li>
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
              <a href={`mailto:${m.contactEmail}`} className="hover:text-brand-cyan">
                {m.contactEmail}
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              <a href="https://menuos.gr" className="hover:text-brand-cyan">
                menuos.gr
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MenuOS. {f.rights}
          </p>
          <p className="text-xs text-slate-500">
            Premium QR menus για την ελληνική αγορά φιλοξενίας
          </p>
        </div>
      </div>
    </footer>
  );
}
