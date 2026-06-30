"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/supervisor", label: "Αρχική", icon: LayoutDashboard, exact: true },
  { href: "/supervisor/organizations", label: "Πελάτες", icon: Building2 },
  { href: "/supervisor/subscriptions", label: "Συνδρομές", icon: CreditCard },
  { href: "/supervisor/users", label: "Ομάδα", icon: Users },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-white/15 text-white shadow-sm ring-1 ring-white/10"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function SupervisorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/supervisor/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/supervisor/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="flex flex-col border-b border-white/10 bg-sidebar-gradient lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="px-4 py-5 lg:px-5 lg:py-6">
            <Logo href="/supervisor" dark showTagline={false} markSize={32} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              MenuOS Ops
            </p>
          </div>
          <nav className="flex flex-1 gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible lg:px-3">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="border-t border-white/10 px-3 py-4 lg:px-3 lg:py-5">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Έξοδος
            </button>
          </div>
        </aside>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
