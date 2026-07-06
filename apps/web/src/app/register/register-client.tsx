"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFooterLink, AuthShell } from "@/components/marketing/marketing-auth-shell";
import { buttonClass } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { useI18n } from "@/i18n/context";
import { formatMessage } from "@/lib/format-message";
import { resolveAuthError } from "@/lib/resolve-auth-error";
import {
  type RegisterPlanIntent,
  registerSubmitLabel,
  registerSubtitle,
} from "@/lib/register-plan-intent";
import { bumpVisitorIntentStep, reportVisitorIntent } from "@/lib/visitor-intent-client";

export default function RegisterPageClient({
  trialDaysGen,
  planIntent,
}: {
  trialDaysGen: string;
  planIntent: RegisterPlanIntent;
}) {
  const router = useRouter();
  const { m } = useI18n();
  const R = m.pages.auth.register;
  const authErrors = m.pages.auth.errors;
  const otpExpiredMsg = R.otpExpired;
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
        setInfo(otpExpiredMsg);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [otpExpiresAt, otpExpiredMsg]);

  function formatOtpCountdown(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return formatMessage(R.otpSeconds, { s: seconds });
    if (seconds === 0) return formatMessage(R.otpMinutes, { m: minutes });
    return formatMessage(R.otpMinutesSeconds, {
      m: minutes,
      s: seconds.toString().padStart(2, "0"),
    });
  }

  async function sendOtp() {
    if (!email.trim()) {
      setError(R.emailRequired);
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
        setError(res.status >= 500 ? authErrors.server_error : resolveAuthError(data, authErrors, R.sendOtpFailed));
        return;
      }
      if (!res.ok) {
        setError(resolveAuthError(data, authErrors, R.sendOtpFailed));
        if (data.retryAfterSeconds) setResendIn(data.retryAfterSeconds);
        return;
      }
      setOtpSent(true);
      setResendIn(60);
      const ttl = data.expiresInSeconds ?? 30 * 60;
      setOtpExpiresAt(Date.now() + ttl * 1000);
      bumpVisitorIntentStep({
        surface: "register",
        step: "register_otp",
        path: "/register",
        visitorLabel: email.trim(),
        planId: planIntent.checkoutPlanId ?? undefined,
      });
      setInfo(
        data.message ?? formatMessage(R.otpSentSuccess, { minutes: Math.round(ttl / 60) }),
      );
    } catch {
      setError(R.networkError);
    } finally {
      setSendingOtp(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!otpSent) {
      setError(R.otpRequired);
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
        setError(res.status >= 500 ? authErrors.server_error : resolveAuthError(data, authErrors, R.registerFailed));
        return;
      }
      if (!res.ok) {
        setError(resolveAuthError(data, authErrors, R.registerFailed));
        if (data.code === "otp_expired" || data.code === "otp_missing" || data.code === "otp_locked") {
          setOtpSent(false);
          setOtpExpiresAt(null);
        }
        return;
      }

      if (planIntent.checkoutPlanId) {
        const planId = planIntent.checkoutPlanId;
        bumpVisitorIntentStep({
          surface: "checkout",
          step: "pay_clicked",
          path: "/register",
          planId,
          visitorLabel: email.trim(),
        });
        const billingRes = await fetch("/api/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            returnPath: "/dashboard/billing",
          }),
        });
        const billingData = (await billingRes.json()) as { checkoutUrl?: string; error?: string };
        if (billingRes.ok && billingData.checkoutUrl) {
          reportVisitorIntent({
            surface: "checkout",
            step: "stripe_redirect",
            path: "/register",
            planId,
            visitorLabel: email.trim(),
          });
          window.location.href = billingData.checkoutUrl;
          return;
        }
        reportVisitorIntent({
          surface: "checkout",
          step: "stripe_init_failed",
          path: "/register",
          planId,
          visitorLabel: email.trim(),
        });
        router.push(`/dashboard/billing?upgrade=${planIntent.checkoutPlanId.toLowerCase()}`);
        router.refresh();
        return;
      }

      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch {
      setError(R.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={R.title}
      subtitle={registerSubtitle(planIntent, trialDaysGen, R)}
      footer={
        <AuthFooterLink text={R.hasAccount} linkText={R.loginLink} href="/login" />
      }
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label={R.nameLabel}
          name="name"
          required
          autoComplete="name"
          placeholder={FORM_PLACEHOLDERS.personName}
        />
        <Field
          label={R.businessLabel}
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
              ? R.sendingOtp
              : resendIn > 0
                ? formatMessage(R.resendIn, { s: resendIn })
                : otpSent
                  ? R.resendOtp
                  : R.sendOtp}
          </button>
          {otpSent ? (
            <span className="text-xs text-emerald-700">
              {R.otpSent}
              {otpExpiresIn > 0
                ? formatMessage(R.otpExpiresIn, { t: formatOtpCountdown(otpExpiresIn) })
                : null}
            </span>
          ) : null}
        </div>

        {otpSent ? (
          <Field
            label={R.otpLabel}
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
          label={R.passwordLabel}
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
          {loading ? R.creating : registerSubmitLabel(planIntent, R)}
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
