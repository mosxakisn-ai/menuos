import { getWaiterAudioContext, unlockWaiterAudio } from "@/lib/waiter-voice";
import {
  type WaiterBeepKind,
  waiterBeepTones,
} from "@/lib/waiter-beep-audio";

export { isInAppBrowser, isIosDevice, isIosStandalonePwa } from "@/lib/waiter-device";

function playBeepTones(kind: WaiterBeepKind) {
  if (typeof window === "undefined") return;
  try {
    unlockWaiterAudio();
    const ctx = getWaiterAudioContext();
    if (!ctx) return;

    const run = () => {
      for (const tone of waiterBeepTones(kind)) {
        const start = ctx.currentTime + tone.startMs / 1000;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = tone.freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(tone.gain, start + 0.01);
        gain.gain.setValueAtTime(tone.gain, start + tone.durationMs / 1000 - 0.02);
        gain.gain.linearRampToValueAtTime(0, start + tone.durationMs / 1000);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + tone.durationMs / 1000 + 0.01);
      }
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

/** Triple ascending beep — kitchen pass. */
export function playPassAlertSound() {
  playBeepTones("pass");
}

/** Two-tone lower beep — guest waiter / bill call. */
export function playGuestCallAlertSound() {
  playBeepTones("guest");
}

/** @deprecated Use playGuestCallAlertSound or playPassAlertSound */
export function playWaiterAlertSound() {
  playGuestCallAlertSound();
}

export function vibrateWaiterAlert() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

export function alertGuestCall() {
  playGuestCallAlertSound();
  vibrateWaiterAlert();
}

export function alertPassSignal() {
  playPassAlertSound();
  vibrateWaiterAlert();
}

/** @deprecated Use alertGuestCall or alertPassSignal */
export function alertNewWaiterCall() {
  alertGuestCall();
}
