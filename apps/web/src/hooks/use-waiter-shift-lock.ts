"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockWaiterAudio } from "@/lib/waiter-voice";

type OrientableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

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

  const onWakeLockReleased = useCallback(() => {
    wakeLockRef.current = null;
    setLocked(false);
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      wakeLockRef.current?.removeEventListener("release", onWakeLockReleased);
      await wakeLockRef.current?.release();
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;
  }, [onWakeLockReleased]);

  const acquireWakeLock = useCallback(async (): Promise<boolean> => {
    if (!wakeLockSupported) return false;
    await releaseWakeLock();
    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLockRef.current = lock;
      lock.addEventListener("release", onWakeLockReleased);
      return true;
    } catch {
      wakeLockRef.current = null;
      return false;
    }
  }, [onWakeLockReleased, releaseWakeLock, wakeLockSupported]);

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

  const disable = useCallback(async () => {
    setBusy(true);
    try {
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
      unlockWaiterAudio();
      const gotWakeLock = await acquireWakeLock();
      if (!gotWakeLock) return;
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
      if (!document.fullscreenElement && locked) {
        void acquireWakeLock();
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [acquireWakeLock, locked]);

  useEffect(() => {
    if (!locked) return;

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void acquireWakeLock();
        void lockPortraitOrientation();
        unlockWaiterAudio();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [acquireWakeLock, locked]);

  useEffect(() => {
    return () => {
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
