/** Short beep for new waiter calls (works while page is open). */
export function playWaiterAlertSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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
    window.setTimeout(() => void ctx.close().catch(() => undefined), 600);
  } catch {
    /* autoplay may be blocked until user gesture — page-open polling still shows calls */
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
