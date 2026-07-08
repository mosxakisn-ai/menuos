"use client";

import { useCallback, useEffect, useState } from "react";
import { isInAppBrowser } from "@/lib/waiter-device";

export type PushState =
  | "loading"
  | "unsupported"
  | "disabled"
  | "prompt"
  | "subscribed"
  | "denied"
  | "failed";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushNotifications(staffAuth?: { venueId: string; staffKey?: string }) {
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
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkState();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [checkState]);

  const enablePush = useCallback(async () => {
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
  }, [staffAuth]);

  const disablePush = useCallback(async () => {
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
  }, [staffAuth]);

  const canEnable = (state === "prompt" || state === "failed") && !inApp;

  return {
    state,
    busy,
    justEnabled,
    inApp,
    canEnable,
    checkState,
    enablePush,
    disablePush,
  };
}
