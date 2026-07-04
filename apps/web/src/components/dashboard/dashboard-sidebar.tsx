"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  History,
  LayoutGrid,
  Lock,
  Monitor,
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
import { dashboardNavHrefsForRole } from "@/lib/dashboard-roles";
import { isLive360NavLocked, live360LockedNavHref } from "@/lib/dashboard-nav";
import type { SubscriptionDisplayInput } from "@/lib/subscription-display";
import { cn } from "@/lib/utils";

const navItems: { href: string; icon: LucideIcon; match?: "exact" }[] = [
  { href: "/dashboard", icon: LayoutGrid, match: "exact" },
  { href: "/dashboard/menus", icon: UtensilsCrossed },
  { href: "/dashboard/qr", icon: QrCode },
  { href: "/dashboard/waiter", icon: Monitor },
  { href: "/dashboard/history", icon: History },
  { href: "/dashboard/settings", icon: Settings },
  { href: "/dashboard/billing", icon: CreditCard },
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
    case "/dashboard/history":
      return d.nav.history;
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
  userRole,
  planId,
  live360Enabled,
  onboardingLocked = false,
}: {
  initialPendingCount: number;
  subscription: SubscriptionDisplayInput | null;
  userRole: string;
  planId: string;
  live360Enabled: boolean;
  onboardingLocked?: boolean;
}) {
  const pathname = usePathname();
  const { d, lang } = useDashboardCopy();
  const pendingCount = usePendingWaiterCount(initialPendingCount, live360Enabled);
  const allowedHrefs = new Set(dashboardNavHrefsForRole(userRole));
  const visibleNavItems = navItems.filter((item) => allowedHrefs.has(item.href));
  const homeHref = userRole === "STAFF" ? "/dashboard/waiter" : "/dashboard";

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-sidebar-gradient p-6 text-white md:flex">
      <Logo href={homeHref} dark showTagline markSize={36} />
      <p className="mt-2 text-xs text-slate-400">{d.layout.tagline}</p>
      <nav className="mt-6 flex min-h-0 flex-1 flex-col space-y-1">
        {visibleNavItems.map(({ href, icon: Icon, match }) => {
          const locked = isLive360NavLocked(href, live360Enabled);
          const onboardingBlocked = onboardingLocked && href !== "/dashboard";
          const active = !locked && !onboardingBlocked && isNavActive(pathname, href, match);
          const itemHref = onboardingBlocked
            ? "/dashboard"
            : locked
              ? live360LockedNavHref(href, userRole)
              : href;
          return (
            <Link
              key={href}
              href={itemHref}
              aria-disabled={locked || onboardingBlocked}
              title={
                onboardingBlocked
                  ? d.onboarding.navLockedHint
                  : locked
                    ? d.nav.proOnlyBadge
                    : undefined
              }
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm transition",
                locked || onboardingBlocked
                  ? "cursor-not-allowed text-white/45 hover:bg-white/5 hover:text-white/55"
                  : active
                    ? "bg-white/12 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "text-white/75 hover:bg-white/8 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                  locked
                    ? "bg-white/5 text-white/40"
                    : active
                      ? "bg-brand-gradient text-white shadow-glow"
                      : "bg-white/8 text-brand-cyan",
                )}
              >
                {locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 truncate">{sidebarNavLabel(href, d)}</span>
              {locked ? (
                <span className="ml-auto shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  {d.nav.proOnlyBadge}
                </span>
              ) : null}
              {!locked && href === "/dashboard/waiter" ? (
                <DashboardCountBadge count={pendingCount} className="ml-auto" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      {subscription ? (
        <DashboardSidebarSubscription subscription={subscription} lang={lang} userRole={userRole} />
      ) : null}
    </aside>
  );
}
