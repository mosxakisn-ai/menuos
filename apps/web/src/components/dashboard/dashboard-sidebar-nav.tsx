"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  LayoutGrid,
  QrCode,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { usePendingWaiterCount } from "@/hooks/use-pending-waiter-count";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Επισκόπηση", icon: LayoutGrid },
  { href: "/dashboard/menus", label: "Κατάλογος", icon: UtensilsCrossed },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/waiter", label: "Σερβιτόρος", icon: Bell },
  { href: "/dashboard/billing", label: "Συνδρομή", icon: CreditCard },
  { href: "/dashboard/settings", label: "Ρυθμίσεις", icon: Settings },
];

export function DashboardSidebarNav({ initialPendingCount }: { initialPendingCount: number }) {
  const pendingCount = usePendingWaiterCount(initialPendingCount);

  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 rounded-button px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Icon className="h-4 w-4 text-brand-cyan" />
          {label}
          {href === "/dashboard/waiter" && pendingCount > 0 ? (
            <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
              {pendingCount}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
