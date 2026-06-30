"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CreditCard, LayoutGrid, QrCode, Settings, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Επισκόπηση", icon: LayoutGrid, exact: true },
  { href: "/dashboard/menus", label: "Κατάλογος", icon: UtensilsCrossed },
  { href: "/dashboard/qr", label: "QR", icon: QrCode },
  { href: "/dashboard/waiter", label: "Κλήσεις", icon: Bell },
  { href: "/dashboard/billing", label: "Συνδρομή", icon: CreditCard },
  { href: "/dashboard/settings", label: "Ρυθμίσεις", icon: Settings },
];

export function DashboardMobileNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex justify-around">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const showBadge = href === "/dashboard/waiter" && pendingCount > 0;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium",
                  active ? "text-brand-blue" : "text-slate-500",
                )}
              >
                <span className="relative">
                  <Icon className={cn("h-5 w-5", active && "text-brand-blue")} />
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
