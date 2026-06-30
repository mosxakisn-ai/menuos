"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";

type PushState = "loading" | "unsupported" | "disabled" | "prompt" | "subscribed" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushNotificationsPrompt() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  const checkState = useCallback(async () => {
    if (typeof window === "undefined") return;
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

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey) as BufferSource,
        });
      }

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid subscription");
      }

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      if (!saveRes.ok) throw new Error("subscribe failed");

      setState("subscribed");
    } catch {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
      } catch {
        /* ignore rollback errors */
      }
      setState("prompt");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        const res = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        if (!res.ok) throw new Error("unsubscribe failed");
        await sub.unsubscribe();
      }
      setState("prompt");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported" || state === "disabled") return null;

  const p = DASHBOARD_EL.push;

  return (
    <Card className="border-brand-blue/20 bg-brand-blue/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" aria-hidden />
          <div>
            <p className="font-semibold text-primary">{p.title}</p>
            <p className="text-sm text-slate-600">
              {state === "subscribed"
                ? p.subscribed
                : state === "denied"
                  ? p.denied
                  : p.description}
            </p>
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
        ) : state === "denied" ? null : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void enablePush()}
            className={buttonClass("primary", "sm")}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            {p.enable}
          </button>
        )}
      </div>
    </Card>
  );
}
