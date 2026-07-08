import { getWaiterAudioContext, unlockWaiterAudio } from "@/lib/waiter-voice";

export { isInAppBrowser, isIosDevice, isIosStandalonePwa } from "@/lib/waiter-device";
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
