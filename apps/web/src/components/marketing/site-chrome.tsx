import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo showTagline={false} markSize={36} />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/pricing" className="hidden text-sm font-medium text-slate-600 hover:text-brand-blue sm:inline">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-blue">
            Login
          </Link>
          <Link href="/register" className={buttonClass("primary", "sm")}>
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-brand-surface py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
        <div>
          <Logo href={false} markSize={32} />
          <p className="mt-3 text-sm text-slate-600">
            Premium digital menus for restaurants, hotels & hospitality.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-navy">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/qr-menu" className="hover:text-brand-blue">QR Menu</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-blue">Pricing</Link></li>
            <li><Link href="/register" className="hover:text-brand-blue">Sign up</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-navy">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/terms" className="hover:text-brand-blue">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-blue">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-center text-xs text-slate-500 sm:px-6">
        © {new Date().getFullYear()} MenuOS. All rights reserved.
      </p>
    </footer>
  );
}
