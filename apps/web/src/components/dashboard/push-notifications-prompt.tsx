"use client";

import { Bell, BellOff, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { isIosDevice, isIosStandalonePwa } from "@/lib/waiter-device";
import { cn } from "@/lib/utils";

export function PushNotificationsPrompt({
  staffAuth,
  variant = "default",
  flat = false,
  compact = false,
}: {
  staffAuth?: { venueId: string; staffKey?: string };
  variant?: "default" | "settings";
  /** Render without outer Card — for embedding inside settings panel card. */
  flat?: boolean;
  /** Staff mobile — minimal banner, hide when subscribed. */
  compact?: boolean;
} = {}) {
  const { d } = useDashboardCopy();
  const p = d.push;
  const { state, busy, justEnabled, inApp, canEnable, enablePush, disablePush } =
    usePushNotifications(staffAuth);

  if (state === "loading") {
    if (compact) return null;
    if (flat) {
      return <p className="text-sm text-slate-500">{p.checking}</p>;
    }
    return (
      <Card className="border-slate-200 bg-white">
        <p className="text-sm text-slate-500">{p.checking}</p>
      </Card>
    );
  }

  if (compact && state === "subscribed" && !justEnabled) {
    return null;
  }

  if (compact && inApp) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950">
        {p.compactInApp}
      </p>
    );
  }

  if (compact && (state === "unsupported" || state === "disabled")) {
    const unsupportedText =
      state === "disabled"
        ? p.disabledServer
        : isIosDevice() && !isIosStandalonePwa()
          ? p.iosBrowserUnsupported
          : p.unsupported;
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-600">
        {unsupportedText}
      </p>
    );
  }

  if (compact && staffAuth) {
    const compactText =
      justEnabled || state === "subscribed"
        ? p.compactSubscribed
        : state === "denied"
          ? p.denied
          : state === "failed"
            ? p.enableFailed
            : p.compactPrompt;
    const showEnable = state === "prompt" || state === "failed";
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
          justEnabled || state === "subscribed"
            ? "border-emerald-200 bg-emerald-50/80"
            : state === "failed" || state === "denied"
              ? "border-amber-200 bg-amber-50/80"
              : "border-brand-blue/20 bg-brand-blue/5",
        )}
      >
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-700">{compactText}</p>
        {showEnable ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enablePush()}
            className={cn(buttonClass("primary", "sm"), "shrink-0 text-xs")}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : p.enable}
          </button>
        ) : null}
      </div>
    );
  }

  const description =
    justEnabled
      ? p.enableSuccess
      : state === "subscribed"
        ? p.subscribed
        : state === "denied"
          ? p.denied
          : state === "failed"
            ? p.enableFailed
            : state === "unsupported"
              ? p.unsupported
              : state === "disabled"
                ? p.disabledServer
                : inApp
                  ? p.inAppBrowser
                  : p.description;

  const panelClass = cn(
    flat ? "rounded-xl border p-4" : undefined,
    "border-brand-blue/20 bg-brand-blue/5",
    justEnabled && "border-emerald-300 bg-emerald-50/80",
    state === "failed" && "border-amber-300 bg-amber-50/80",
    state === "subscribed" && !justEnabled && "border-emerald-200/80 bg-emerald-50/40",
  );

  const Shell = flat ? "div" : Card;

  return (
    <div className={flat ? undefined : "space-y-3"}>
      {inApp && !compact ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="flex items-start gap-2 font-semibold">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {p.inAppBrowser}
          </p>
        </div>
      ) : null}

      <Shell className={panelClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            {justEnabled || state === "subscribed" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" aria-hidden />
            )}
            <div>
              <p className="font-semibold text-primary">{p.title}</p>
              <p
                className={cn(
                  "mt-1 text-sm leading-relaxed",
                  justEnabled ? "font-medium text-emerald-800" : "text-slate-600",
                )}
              >
                {description}
              </p>
              {staffAuth && state === "prompt" && !inApp && !compact ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {isIosDevice() ? p.iosHint : p.androidHint}
                </p>
              ) : null}
              {staffAuth && !compact ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.pageOpenHint}</p>
              ) : variant === "settings" ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.managerHint}</p>
              ) : null}
            </div>
          </div>
          {state === "subscribed" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void disablePush()}
              className={buttonClass("secondary", "sm")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
              {p.disable}
            </button>
          ) : state === "denied" || state === "unsupported" || state === "disabled" ? null : (
            <button
              type="button"
              disabled={busy || !canEnable}
              onClick={() => void enablePush()}
              className={buttonClass("primary", "sm")}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {p.enable}
            </button>
          )}
        </div>
      </Shell>
    </div>
  );
}
