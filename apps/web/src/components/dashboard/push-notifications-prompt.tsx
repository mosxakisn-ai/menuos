"use client";

import { Bell, BellOff, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { isInAppBrowser, isIosDevice, isIosStandalonePwa } from "@/lib/waiter-device";
import { cn } from "@/lib/utils";

type PushState = "loading" | "unsupported" | "disabled" | "prompt" | "subscribed" | "denied" | "failed";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

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
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);
  const [inApp, setInApp] = useState(false);

  const checkState = useCallback(async () => {
    if (typeof window === "undefined") return;
    setInApp(isInAppBrowser());

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }

    const res = await fetch("/api/push/vapid-public-key");
    const data = (await res.json()) as { enabled?: boolean; publicKey?: string };
    if (!data.enabled || !data.publicKey) {
      setState("disabled");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    setState(sub ? "subscribed" : "prompt");
  }, []);

  useEffect(() => {
    void checkState();
  }, [checkState]);

  async function enablePush() {
    setBusy(true);
    setJustEnabled(false);
    let createdNewSub = false;
    let sub: PushSubscription | null = null;
    try {
      const keyRes = await fetch("/api/push/vapid-public-key");
      const keyData = (await keyRes.json()) as { enabled?: boolean; publicKey?: string };
      if (!keyData.enabled || !keyData.publicKey) {
        setState("disabled");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "prompt");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
        });
        createdNewSub = true;
      }

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid subscription");
      }

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: staffAuth ? "include" : "same-origin",
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          ...(staffAuth
            ? {
                venueId: staffAuth.venueId,
                ...(staffAuth.staffKey ? { staffKey: staffAuth.staffKey } : {}),
              }
            : {}),
        }),
      });
      if (!saveRes.ok) throw new Error("subscribe failed");

      setState("subscribed");
      setJustEnabled(true);
      window.setTimeout(() => setJustEnabled(false), 8000);
    } catch {
      if (createdNewSub) {
        try {
          await sub?.unsubscribe();
        } catch {
          /* ignore */
        }
      }
      setState("failed");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setJustEnabled(false);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: staffAuth ? "include" : "same-origin",
          body: JSON.stringify({
            endpoint,
            ...(staffAuth
              ? {
                  venueId: staffAuth.venueId,
                  ...(staffAuth.staffKey ? { staffKey: staffAuth.staffKey } : {}),
                }
              : {}),
          }),
        });
        if (!res.ok) throw new Error("unsubscribe failed");
        await sub.unsubscribe();
      }
      setState("prompt");
    } finally {
      setBusy(false);
    }
  }

  const canEnable = (state === "prompt" || state === "failed") && !inApp;
  const Shell = flat ? "div" : Card;

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
