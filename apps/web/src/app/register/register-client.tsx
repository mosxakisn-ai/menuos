"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/marketing/site-chrome";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterPageClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  async function sendOtp() {
    if (!email.trim()) {
      setError("Συμπλήρωσε πρώτα το email σου.");
      return;
    }
    setSendingOtp(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        retryAfterSeconds?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία αποστολής κωδικού.");
        if (data.retryAfterSeconds) setResendIn(data.retryAfterSeconds);
        return;
      }
      setOtpSent(true);
      setResendIn(60);
      setInfo(data.message ?? "Στείλαμε κωδικό στο email σου.");
    } catch {
      setError("Σφάλμα δικτύου. Δοκίμασε ξανά.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otpSent) {
      setError("Πρώτα στείλε και επιβεβαίωσε τον κωδικό στο email σου.");
      return;
    }

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
        otp: form.get("otp"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Η εγγραφή απέτυχε.");
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
          <h1 className="font-serif text-2xl font-bold text-primary">Δημιουργία λογαριασμού</h1>
          <p className="mt-2 text-sm text-slate-600">
            Δωρεάν δοκιμή 14 ημερών. Θα σου στείλουμε κωδικό επιβεβαίωσης στο email.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Το όνομά σου" name="name" required />
            <Field label="Επωνυμία επιχείρησης" name="businessName" required />

            <label className="block text-sm">
              <span className="font-medium text-primary">Email</span>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                }}
                className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5 outline-none focus:border-primary"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={sendingOtp || resendIn > 0}
                onClick={sendOtp}
                className={buttonClass("secondary", "sm")}
              >
                {sendingOtp
                  ? "Αποστολή..."
                  : resendIn > 0
                    ? `Ξανά σε ${resendIn}s`
                    : otpSent
                      ? "Ξαναστείλε κωδικό"
                      : "Στείλε κωδικό"}
              </button>
              {otpSent ? (
                <span className="text-xs text-emerald-700">Κωδικός στάλθηκε — έλεγξε και spam.</span>
              ) : null}
            </div>

            {otpSent ? (
              <Field
                label="Κωδικός από email (6 ψηφία)"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="123456"
              />
            ) : null}

            <Field label="Κωδικός πρόσβασης" name="password" type="password" required minLength={8} />

            {info ? <p className="text-sm text-emerald-700">{info}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || !otpSent}
              className={`w-full ${buttonClass("primary")}`}
            >
              {loading ? "Δημιουργία..." : "Δημιουργία λογαριασμού"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Έχεις ήδη λογαριασμό;{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Σύνδεση
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
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
