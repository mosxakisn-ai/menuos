"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

export function SupervisorLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/supervisor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία σύνδεσης.");
        return;
      }
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/supervisor") ? next : "/supervisor");
      router.refresh();
    } catch {
      setError("Σφάλμα δικτύου.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar-gradient px-4 py-12">
      <Card className="w-full max-w-md border-white/20 bg-white/95 shadow-xl backdrop-blur">
        <div className="mb-6 text-center">
          <Logo href="/" markSize={40} />
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-brand-blue">MenuOS Ops</p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-brand-navy">Supervisor</h1>
          <p className="mt-1 text-sm text-slate-600">Εσωτερική διαχείριση πλατφόρμας</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className={dashboardLabelClass}>Username</span>
            <input
              className={dashboardFieldClass}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={FORM_PLACEHOLDERS.supervisorUsername}
            />
          </label>
          <PasswordField
            label="Password"
            labelClassName={dashboardLabelClass}
            wrapperClassName="relative mt-1.5"
            className={`${dashboardFieldClass} pr-10`}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={FORM_PLACEHOLDERS.passwordCurrent}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className={`w-full ${buttonClass("primary")}`}>
            {loading ? "Σύνδεση…" : "Είσοδος"}
          </button>
        </form>
      </Card>
    </div>
  );
}
