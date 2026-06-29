"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
