import { getWaiterAudioContext, unlockWaiterAudio } from "@/lib/waiter-voice";

/** Short beep for new waiter calls (works while page is open). */
export function playWaiterAlertSound() {
  if (typeof window === "undefined") return;
  try {
    unlockWaiterAudio();
    const ctx = getWaiterAudioContext();
    if (!ctx) return;
    const run = () => {
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.12;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(880, ctx.currentTime, 0.12);
      playTone(988, ctx.currentTime + 0.18, 0.18);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(run).catch(() => undefined);
      return;
    }
    run();
  } catch {
    /* autoplay may be blocked until user gesture */
  }
}

export function vibrateWaiterAlert() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

export function alertNewWaiterCall() {
  playWaiterAlertSound();
  vibrateWaiterAlert();
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Messenger|WhatsApp|Twitter|LinkedInApp/i.test(ua);
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isIosStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
