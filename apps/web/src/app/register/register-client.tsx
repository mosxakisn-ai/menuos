"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/marketing/site-chrome";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterPageClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        businessName: form.get("businessName"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <Card>
          <h1 className="font-serif text-2xl font-bold text-primary">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">Start your 14-day free trial.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Your name" name="name" required />
            <Field label="Business name" name="businessName" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Password" name="password" type="password" required minLength={8} />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={loading} className={`w-full ${buttonClass("primary")}`}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block text-sm">
      <span className="font-medium text-primary">{label}</span>
      <input
        {...inputProps}
        className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5 outline-none focus:border-primary"
      />
    </label>
  );
}
