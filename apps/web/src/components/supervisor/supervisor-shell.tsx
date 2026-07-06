"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LifeBuoy, LogOut, Radio, Sparkles, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/supervisor", label: "Αρχική", icon: LayoutDashboard, exact: true },
  { href: "/supervisor/online", label: "Online", icon: Radio },
  { href: "/supervisor/organizations", label: "Πελάτες", icon: Building2 },
  { href: "/supervisor/gemini", label: "Gemini AI", icon: Sparkles },
  { href: "/supervisor/help-desk", label: "Help Desk", icon: LifeBuoy },
  { href: "/supervisor/subscriptions", label: "Πακέτα", icon: CreditCard },
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
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "relative bg-white/15 text-white shadow-sm ring-1 ring-white/20 lg:pl-4"
          : "text-slate-300 hover:bg-white/10 hover:text-white",
        active && "before:absolute before:left-0 before:top-1/2 before:hidden before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r before:bg-cyan-400 lg:before:block",
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-brand-surface to-slate-200/80">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="flex flex-col border-b border-white/10 bg-sidebar-gradient shadow-xl shadow-slate-900/10 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-56 lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="border-b border-white/5 px-4 py-4 lg:px-4 lg:py-5">
            <Logo href="/supervisor" dark showTagline={false} markSize={28} />
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              MenuOS Ops
            </p>
          </div>
          <nav className="flex flex-1 gap-1 overflow-x-auto px-2 py-3 lg:flex-col lg:overflow-visible lg:px-2">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="border-t border-white/10 px-2 py-3 lg:px-2 lg:py-4">
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
        <main className="flex-1 lg:pl-56">
          <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
