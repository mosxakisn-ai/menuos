"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockWaiterAudio } from "@/lib/waiter-voice";

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
      setLocked(false);
    } finally {
      setBusy(false);
    }
  }, [exitFullscreen, releaseWakeLock]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      unlockWaiterAudio();
      const gotWakeLock = await acquireWakeLock();
      if (wakeLockSupported && !gotWakeLock) return;
      await enterFullscreen();
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
        unlockWaiterAudio();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [acquireWakeLock, locked]);

  useEffect(() => {
    return () => {
      void releaseWakeLock();
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
