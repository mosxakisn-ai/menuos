"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, LayoutGrid, Monitor, QrCode, Settings, UtensilsCrossed } from "lucide-react";
import { DashboardLanguageSwitcher } from "@/components/dashboard/dashboard-language-switcher";
import { DashboardCountBadge } from "@/components/dashboard/dashboard-ui";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { usePendingWaiterCount } from "@/hooks/use-pending-waiter-count";
import { dashboardNavHrefsForRole } from "@/lib/dashboard-roles";
import { cn } from "@/lib/utils";

export function DashboardMobileNav({
  initialPendingCount = 0,
  userRole,
}: {
  initialPendingCount?: number;
  userRole: string;
}) {
  const pathname = usePathname();
  const { d } = useDashboardCopy();
  const pendingCount = usePendingWaiterCount(initialPendingCount);

  const links = [
    { href: "/dashboard", label: d.nav.overview, icon: LayoutGrid, exact: true },
    { href: "/dashboard/menus", label: d.menu, icon: UtensilsCrossed },
    { href: "/dashboard/qr", label: d.nav.qrShort, icon: QrCode },
    { href: "/dashboard/waiter", label: d.nav.callsShort, icon: Monitor },
    { href: "/dashboard/history", label: d.nav.history, icon: History },
    { href: "/dashboard/settings", label: d.settings, icon: Settings },
    { href: "/dashboard/billing", label: d.subscription, icon: CreditCard },
  ];
  const allowedHrefs = new Set(dashboardNavHrefsForRole(userRole));
  const visibleLinks = links.filter((link) => allowedHrefs.has(link.href));

  return (
    <>
      <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] right-3 z-40 md:hidden">
        <DashboardLanguageSwitcher className="shadow-card" />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-0.5 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-lg justify-between">
          {visibleLinks.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const showBadge = href === "/dashboard/waiter" && pendingCount > 0;
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className={cn(
                    "relative mx-auto flex max-w-[4.5rem] flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium leading-tight",
                    active ? "text-brand-blue" : "text-slate-500",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full transition",
                      active ? "bg-brand-blue/10 text-brand-blue" : "text-slate-500",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {showBadge ? (
                      <DashboardCountBadge
                        count={pendingCount}
                        className="absolute -right-0.5 -top-0.5 scale-90"
                      />
                    ) : null}
                  </span>
                  <span className="max-w-full truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
