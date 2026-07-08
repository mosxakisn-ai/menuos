"use client";

import {
  Check,
  Home,
  Loader2,
  Share,
  Smartphone,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { playWaiterAlertSound } from "@/lib/waiter-alert";
import {
  isIosDevice,
  isStandalonePwa,
} from "@/lib/waiter-device";
import { cn } from "@/lib/utils";
import { speakPassMessage, unlockWaiterAudio } from "@/lib/waiter-voice";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function ReadinessChip({
  label,
  ok,
  muted,
}: {
  label: string;
  ok: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        muted
          ? "bg-slate-100 text-slate-500"
          : ok
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900",
      )}
    >
      {muted ? (
        <span className="text-slate-400" aria-hidden>
          —
        </span>
      ) : ok ? (
        <Check className="h-3 w-3" aria-hidden />
      ) : (
        <X className="h-3 w-3" aria-hidden />
      )}
      {label}
    </span>
  );
}

export function StaffWaiterSetupBar({
  staffAuth,
  voiceEnabled,
}: {
  staffAuth: { venueId: string; staffKey?: string };
  voiceEnabled: boolean;
}) {
  const { d } = useDashboardCopy();
  const s = d.waiter.staffSetup;
  const push = usePushNotifications(staffAuth);

  const [installed, setInstalled] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installBusy, setInstallBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const refreshInstalled = useCallback(() => {
    setInstalled(isStandalonePwa());
  }, []);

  useEffect(() => {
    refreshInstalled();
    const onVisible = () => refreshInstalled();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshInstalled]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const pushReady = push.state === "subscribed";
  const ios = isIosDevice();
  const installNeeded = !installed && (ios || !!deferredPrompt);
  const pushNeeded = push.canEnable && (!ios || installed);
  const showActionRow = installNeeded || pushNeeded;
  const allReady = pushReady && (!ios || installed);
  const iosNeedsInstallFirst =
    ios && !installed && (push.state === "unsupported" || push.state === "prompt");
  const pushBlockedMessage =
    push.state === "denied"
      ? s.pushDenied
      : push.state === "unsupported" && ios && !installed
        ? d.push.iosBrowserUnsupported
        : push.state === "unsupported"
          ? s.pushUnsupported
          : null;

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    setInstallBusy(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        refreshInstalled();
      }
    } finally {
      setInstallBusy(false);
    }
  }

  function handleInstallClick() {
    if (ios) {
      setIosSheetOpen(true);
      return;
    }
    void handleAndroidInstall();
  }

  async function handleTestSound() {
    setTesting(true);
    try {
      unlockWaiterAudio();
      playWaiterAlertSound();
      if (voiceEnabled) {
        speakPassMessage({ tableNumber: "12" });
      }
    } finally {
      window.setTimeout(() => setTesting(false), 2500);
    }
  }

  if (push.state === "loading") {
    return null;
  }

  if (push.inApp) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950">
        {s.inAppWarning}
      </p>
    );
  }

  if (push.state === "disabled") {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-600">
        {d.push.disabledServer}
      </p>
    );
  }

  if (push.state === "unsupported" && !iosNeedsInstallFirst) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-600">
        {ios && !installed ? d.push.iosBrowserUnsupported : s.pushUnsupported}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "rounded-lg border px-3 py-2",
          allReady ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">{s.readinessLabel}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <ReadinessChip
              label={s.installedLabel}
              ok={installed}
              muted={!ios && !installed}
            />
            <ReadinessChip label={s.pushLabel} ok={pushReady} />
            <ReadinessChip
              label={voiceEnabled ? s.voiceLabel : s.voiceOff}
              ok={voiceEnabled}
              muted={!voiceEnabled}
            />
          </div>
        </div>
        {allReady ? (
          <p className="mt-1.5 text-[11px] leading-snug text-emerald-800">{s.allReady}</p>
        ) : iosNeedsInstallFirst ? (
          <p className="mt-1.5 text-[11px] leading-snug text-amber-900">{d.push.iosBrowserUnsupported}</p>
        ) : null}
      </div>

      {showActionRow ? (
        <div
          className={cn(
            "grid gap-2",
            installNeeded && pushNeeded ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {installNeeded ? (
            <button
              type="button"
              disabled={installBusy || (!ios && !deferredPrompt)}
              onClick={handleInstallClick}
              className={cn(buttonClass("secondary", "sm"), "w-full text-xs")}
            >
              {installBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Home className="h-3.5 w-3.5" />
              )}
              {s.installButton}
            </button>
          ) : null}
          {pushNeeded ? (
            <button
              type="button"
              disabled={push.busy}
              onClick={() => void push.enablePush()}
              className={cn(buttonClass("primary", "sm"), "w-full text-xs")}
            >
              {push.busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              {s.pushButton}
            </button>
          ) : null}
        </div>
      ) : null}

      {pushBlockedMessage ? (
        <p className="text-xs leading-snug text-amber-900">{pushBlockedMessage}</p>
      ) : null}

      {allReady ? (
        <button
          type="button"
          disabled={testing}
          onClick={() => void handleTestSound()}
          className={cn(buttonClass("secondary", "sm"), "w-full text-xs")}
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
          {testing ? s.testPlaying : s.testButton}
        </button>
      ) : null}

      {iosSheetOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onClick={() => setIosSheetOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p id="ios-install-title" className="font-semibold text-primary">
                  {s.iosInstallTitle}
                </p>
                <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                  <li className="flex gap-2">
                    <Share className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
                    {s.iosStep1}
                  </li>
                  <li>{s.iosStep2}</li>
                  <li>{s.iosStep3}</li>
                </ol>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIosSheetOpen(false)}
              className={cn(buttonClass("primary", "sm"), "mt-4 w-full")}
            >
              {s.iosClose}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
