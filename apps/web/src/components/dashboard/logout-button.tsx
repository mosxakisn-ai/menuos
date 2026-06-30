"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DASHBOARD_EL } from "@/content/dashboard-el";

type LogoutButtonProps = {
  variant?: "sidebar" | "header";
};

export function LogoutButton({ variant = "sidebar" }: LogoutButtonProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const isHeader = variant === "header";

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "flex items-center gap-2 rounded-button text-sm transition",
        isHeader
          ? "border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
          : "w-full px-3 py-2.5 text-white/70 hover:bg-white/10",
      )}
    >
      <LogOut className="h-4 w-4" />
      {DASHBOARD_EL.logout}
    </button>
  );
}
