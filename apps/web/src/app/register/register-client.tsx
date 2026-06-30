"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFooterLink, AuthShell } from "@/components/marketing/marketing-layout";
import { buttonClass } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

export default function RegisterPageClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!otpExpiresAt) {
      setOtpExpiresIn(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpExpiresIn(remaining);
      if (remaining <= 0) {
        setOtpSent(false);
        setOtpExpiresAt(null);
        setInfo("Ο κωδικός έληξε. Στείλε νέο κωδικό στο email σου.");
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpExpiresAt]);

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
      let data: {
        error?: string;
        message?: string;
        retryAfterSeconds?: number;
        expiresInSeconds?: number;
        code?: string;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError(
          res.status >= 500
            ? "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο ή γράψε στο info@b-os.gr."
            : "Αποτυχία αποστολής κωδικού.",
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Αποτυχία αποστολής κωδικού.");
        if (data.retryAfterSeconds) setResendIn(data.retryAfterSeconds);
        return;
      }
      setOtpSent(true);
      setResendIn(60);
      const ttl = data.expiresInSeconds ?? 30 * 60;
      setOtpExpiresAt(Date.now() + ttl * 1000);
      setInfo(data.message ?? `Στείλαμε κωδικό στο email σου. Ισχύει για ${Math.round(ttl / 60)} λεπτά.`);
    } catch {
      setError("Σφάλμα σύνδεσης. Έλεγξε το internet και δοκίμασε ξανά.");
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
    try {
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
      let data: { error?: string; code?: string } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError(
          res.status >= 500
            ? "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο ή γράψε στο info@b-os.gr."
            : "Η εγγραφή απέτυχε.",
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Η εγγραφή απέτυχε.");
        if (
          data.code === "otp_expired" ||
          data.code === "otp_missing" ||
          data.code === "otp_locked" ||
          data.error?.includes("Στείλε νέο κωδικό")
        ) {
          setOtpSent(false);
          setOtpExpiresAt(null);
        }
        return;
      }
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch {
      setError("Σφάλμα σύνδεσης. Έλεγξε το internet και δοκίμασε ξανά.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Δημιουργία λογαριασμού"
      subtitle="Δωρεάν δοκιμή 7 ημερών. Θα σου στείλουμε κωδικό επιβεβαίωσης στο email (ισχύει 30 λεπτά)."
      footer={
        <AuthFooterLink text="Έχεις ήδη λογαριασμό;" linkText="Σύνδεση" href="/login" />
      }
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Το όνομά σου"
          name="name"
          required
          autoComplete="name"
          placeholder={FORM_PLACEHOLDERS.personName}
        />
        <Field
          label="Επωνυμία επιχείρησης"
          name="businessName"
          required
          autoComplete="organization"
          placeholder={FORM_PLACEHOLDERS.businessName}
        />

        <label className="block text-sm">
          <span className="font-medium text-brand-navy">Email</span>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOtpSent(false);
              setOtpExpiresAt(null);
            }}
            autoComplete="email"
            placeholder={FORM_PLACEHOLDERS.email}
            className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
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
            <span className="text-xs text-emerald-700">
              Κωδικός στάλθηκε — έλεγξε και spam.
              {otpExpiresIn > 0 ? ` Λήγει σε ${formatOtpCountdown(otpExpiresIn)}.` : null}
            </span>
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
            placeholder={FORM_PLACEHOLDERS.otp}
          />
        ) : null}

        <PasswordField
          label="Κωδικός πρόσβασης"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={FORM_PLACEHOLDERS.passwordNew}
        />

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
    </AuthShell>
  );
}

function formatOtpCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} δευτ.`;
  if (seconds === 0) return `${minutes} λεπ.`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
