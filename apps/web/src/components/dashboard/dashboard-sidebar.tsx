"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  LayoutGrid,
  QrCode,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { DashboardCountBadge } from "@/components/dashboard/dashboard-ui";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { DashboardSidebarSubscription } from "@/components/dashboard/dashboard-sidebar-subscription";
import { usePendingWaiterCount } from "@/hooks/use-pending-waiter-count";
import type { SubscriptionDisplayInput } from "@/lib/subscription-display";
import { cn } from "@/lib/utils";

const navItems: { href: string; icon: LucideIcon; match?: "exact" }[] = [
  { href: "/dashboard", icon: LayoutGrid, match: "exact" },
  { href: "/dashboard/menus", icon: UtensilsCrossed },
  { href: "/dashboard/qr", icon: QrCode },
  { href: "/dashboard/waiter", icon: Bell },
  { href: "/dashboard/billing", icon: CreditCard },
  { href: "/dashboard/settings", icon: Settings },
];

function sidebarNavLabel(href: string, d: ReturnType<typeof useDashboardCopy>["d"]): string {
  switch (href) {
    case "/dashboard":
      return d.nav.overview;
    case "/dashboard/menus":
      return d.menu;
    case "/dashboard/qr":
      return d.qrCodes;
    case "/dashboard/waiter":
      return d.nav.waiter;
    case "/dashboard/billing":
      return d.subscription;
    case "/dashboard/settings":
      return d.settings;
    default:
      return href;
  }
}

function isNavActive(pathname: string, href: string, match?: "exact") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({
  initialPendingCount,
  subscription,
}: {
  initialPendingCount: number;
  subscription: SubscriptionDisplayInput | null;
}) {
  const pathname = usePathname();
  const { d, lang } = useDashboardCopy();
  const pendingCount = usePendingWaiterCount(initialPendingCount);

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-sidebar-gradient p-6 text-white md:flex">
      <Logo href="/dashboard" dark showTagline markSize={36} />
      <p className="mt-2 text-xs text-slate-400">{d.layout.tagline}</p>
      <nav className="mt-6 flex min-h-0 flex-1 flex-col space-y-1">
        {navItems.map(({ href, icon: Icon, match }) => {
          const active = isNavActive(pathname, href, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm transition",
                active
                  ? "bg-white/12 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-white/75 hover:bg-white/8 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                  active ? "bg-brand-gradient text-white shadow-glow" : "bg-white/8 text-brand-cyan",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate">{sidebarNavLabel(href, d)}</span>
              {href === "/dashboard/waiter" ? (
                <DashboardCountBadge count={pendingCount} className="ml-auto" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      {subscription ? <DashboardSidebarSubscription subscription={subscription} lang={lang} /> : null}
    </aside>
  );
}
