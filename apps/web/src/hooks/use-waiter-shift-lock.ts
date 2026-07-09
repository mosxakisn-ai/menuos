"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockWaiterAudio } from "@/lib/waiter-voice";

type OrientableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

const RESTORE_DEBOUNCE_MS = 500;

function getOrientableScreen(): OrientableScreenOrientation | null {
  if (typeof screen === "undefined" || !("orientation" in screen)) return null;
  const orientation = screen.orientation as OrientableScreenOrientation;
  return typeof orientation.lock === "function" ? orientation : null;
}

async function lockPortraitOrientation(): Promise<boolean> {
  const orientation = getOrientableScreen();
  if (!orientation?.lock) return false;
  try {
    await orientation.lock("portrait-primary");
    return true;
  } catch {
    try {
      await orientation.lock("portrait");
      return true;
    } catch {
      return false;
    }
  }
}

function unlockPortraitOrientation(): void {
  try {
    getOrientableScreen()?.unlock?.();
  } catch {
    /* ignore */
  }
}

export type WaiterShiftLockState = {
  locked: boolean;
  wakeLockSupported: boolean;
  fullscreenActive: boolean;
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  toggle: () => Promise<void>;
};

export function useWaiterShiftLock(): WaiterShiftLockState {
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const userWantsLockRef = useRef(false);
  const restoreInFlightRef = useRef(false);
  const lastRestoreAtRef = useRef(0);

  const releaseWakeLock = useCallback(async () => {
    try {
      const current = wakeLockRef.current;
      if (current) {
        current.onrelease = null;
        await current.release();
      }
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;
  }, []);

  const acquireWakeLock = useCallback(async (): Promise<boolean> => {
    if (!wakeLockSupported || !userWantsLockRef.current) return false;
    await releaseWakeLock();
    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = lock;
      lock.onrelease = () => {
        wakeLockRef.current = null;
        if (!userWantsLockRef.current) {
          unlockPortraitOrientation();
          setLocked(false);
          return;
        }
        if (document.visibilityState === "visible") {
          void acquireWakeLock();
        }
      };
      return true;
    } catch {
      wakeLockRef.current = null;
      return false;
    }
  }, [releaseWakeLock, wakeLockSupported]);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    const root = document.documentElement;
    if (!root.requestFullscreen) return;
    try {
      await root.requestFullscreen();
    } catch {
      /* optional — many phones block outside user gesture */
    }
  }, []);

  const restoreShiftLock = useCallback(async () => {
    if (!userWantsLockRef.current) return;
    const now = Date.now();
    if (restoreInFlightRef.current || now - lastRestoreAtRef.current < RESTORE_DEBOUNCE_MS) {
      return;
    }
    restoreInFlightRef.current = true;
    lastRestoreAtRef.current = now;
    try {
      const gotWakeLock = await acquireWakeLock();
      if (!gotWakeLock) {
        setLocked(false);
        return;
      }
      if (!document.fullscreenElement) {
        await enterFullscreen();
      }
      await lockPortraitOrientation();
      setLocked(true);
    } finally {
      restoreInFlightRef.current = false;
    }
  }, [acquireWakeLock, enterFullscreen]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      userWantsLockRef.current = false;
      await releaseWakeLock();
      await exitFullscreen();
      unlockPortraitOrientation();
      setLocked(false);
    } finally {
      setBusy(false);
    }
  }, [exitFullscreen, releaseWakeLock]);

  const enable = useCallback(async () => {
    if (!wakeLockSupported) return;
    setBusy(true);
    try {
      userWantsLockRef.current = true;
      unlockWaiterAudio();
      const gotWakeLock = await acquireWakeLock();
      if (!gotWakeLock) {
        userWantsLockRef.current = false;
        return;
      }
      await enterFullscreen();
      await lockPortraitOrientation();
      setLocked(true);
    } finally {
      setBusy(false);
    }
  }, [acquireWakeLock, enterFullscreen, wakeLockSupported]);

  const toggle = useCallback(async () => {
    if (locked) await disable();
    else await enable();
  }, [disable, enable, locked]);

  useEffect(() => {
    setWakeLockSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreenActive(Boolean(document.fullscreenElement));
      if (userWantsLockRef.current && document.visibilityState === "visible") {
        void restoreShiftLock();
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [restoreShiftLock]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible" && userWantsLockRef.current) {
        void restoreShiftLock();
        unlockWaiterAudio();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [restoreShiftLock]);

  useEffect(() => {
    return () => {
      userWantsLockRef.current = false;
      void releaseWakeLock();
      unlockPortraitOrientation();
    };
  }, [releaseWakeLock]);

  return {
    locked,
    wakeLockSupported,
    fullscreenActive,
    busy,
    enable,
    disable,
    toggle,
  };
}
