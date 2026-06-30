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

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex justify-around">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium",
                  active ? "text-brand-blue" : "text-slate-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-brand-blue")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
