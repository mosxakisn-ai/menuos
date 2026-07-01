"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFooterLink, AuthShell } from "@/components/marketing/marketing-layout";
import { buttonClass } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { useI18n } from "@/i18n/context";
import { formatMessage } from "@/lib/format-message";

export default function LoginPageClient({ trialDaysGen }: { trialDaysGen: string }) {
  const router = useRouter();
  const { m } = useI18n();
  const L = m.pages.auth.login;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? L.failed);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title={L.title}
      subtitle={L.subtitle}
      footer={
        <AuthFooterLink
          text={L.noAccount}
          linkText={formatMessage(L.freeTrial, { days: trialDaysGen })}
          href="/register"
        />
      }
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={FORM_PLACEHOLDERS.email}
        />
        <PasswordField
          label={L.password}
          name="password"
          required
          autoComplete="current-password"
          placeholder={FORM_PLACEHOLDERS.passwordCurrent}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={loading} className={`w-full ${buttonClass("primary")}`}>
          {loading ? L.submitting : L.submit}
        </button>
      </form>
    </AuthShell>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block text-sm">
      <span className="font-medium text-brand-navy">{label}</span>
      <input
        {...inputProps}
        className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />
    </label>
  );
}
