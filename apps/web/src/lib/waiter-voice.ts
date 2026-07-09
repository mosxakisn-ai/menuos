import {
  buildPassSignalAnnouncement,
  type PassAnnouncementOptions,
  type PassAnnouncementLocation,
} from "@menuos/shared";
import { isIosDevice } from "@/lib/waiter-device";

let audioUnlocked = false;
let sharedAudioCtx: AudioContext | null = null;
let sharedSpeechAudio: HTMLAudioElement | null = null;
let sharedPrimeAudio: HTMLAudioElement | null = null;
let iosSpeechPrimed = false;
let activeSpeechBlobUrl: string | null = null;

export function getWaiterAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
  return sharedAudioCtx;
}

function getSpeechAudioElement(): HTMLAudioElement {
  if (!sharedSpeechAudio) {
    sharedSpeechAudio = new Audio();
    sharedSpeechAudio.preload = "auto";
  }
  return sharedSpeechAudio;
}

function revokeActiveSpeechBlobUrl(): void {
  if (!activeSpeechBlobUrl) return;
  URL.revokeObjectURL(activeSpeechBlobUrl);
  activeSpeechBlobUrl = null;
}

function primeIosSpeechAudio(): void {
  if (!isIosDevice() || iosSpeechPrimed) return;
  try {
    if (!sharedPrimeAudio) {
      sharedPrimeAudio = new Audio();
      sharedPrimeAudio.preload = "auto";
    }
    sharedPrimeAudio.src = "/api/waiter-beep?kind=pass";
    sharedPrimeAudio.volume = 0.01;
    void sharedPrimeAudio
      .play()
      .then(() => {
        iosSpeechPrimed = true;
      })
      .catch(() => {
        iosSpeechPrimed = false;
      });
  } catch {
    iosSpeechPrimed = false;
  }
}

/** Call once after user taps the waiter panel (unlocks iOS audio + speech). */
export function unlockWaiterAudio(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getWaiterAudioContext();
    if (ctx?.state === "suspended") void ctx.resume();
    primeIosSpeechAudio();
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.getVoices();
    if (!audioUnlocked) {
      const prime = new SpeechSynthesisUtterance("\u200b");
      prime.volume = 0.01;
      prime.lang = "el-GR";
      prime.rate = 1.1;
      synth.speak(prime);
      audioUnlocked = true;
    }
  } catch {
    /* ignore */
  }
}

function pickVoiceForAnnouncement(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "el-GR") ??
    voices.find((voice) => voice.lang.startsWith("el")) ??
    voices.find((voice) => voice.default) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    voices[0] ??
    null
  );
}

function startSpeech(synth: SpeechSynthesis, utterance: SpeechSynthesisUtterance) {
  const speakNow = () => {
    const voice = pickVoiceForAnnouncement();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang.startsWith("el") ? "el-GR" : voice.lang;
    }
    synth.speak(utterance);
  };

  const voice = pickVoiceForAnnouncement();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang.startsWith("el") ? "el-GR" : voice.lang;
    synth.speak(utterance);
    return;
  }

  let spoke = false;
  const speakOnce = () => {
    if (spoke) return;
    spoke = true;
    speakNow();
  };

  synth.addEventListener("voiceschanged", speakOnce);
  synth.getVoices();
  window.setTimeout(() => {
    synth.removeEventListener("voiceschanged", speakOnce);
    speakOnce();
  }, 400);
}

async function speakGreekLineViaServerAudio(text: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/pass-announcement-audio?text=${encodeURIComponent(text)}`,
      { credentials: "same-origin" },
    );
    if (!res.ok) return false;
    const blob = await res.blob();
    const audio = getSpeechAudioElement();
    audio.pause();
    revokeActiveSpeechBlobUrl();
    activeSpeechBlobUrl = URL.createObjectURL(blob);
    audio.currentTime = 0;
    audio.volume = 1;
    audio.src = activeSpeechBlobUrl;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function speakGreekLineViaWebSpeech(text: string): void {
  const synth = window.speechSynthesis;
  if (!synth) return;
  unlockWaiterAudio();
  if (synth.speaking || synth.pending) synth.cancel();
  const run = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "el-GR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    startSpeech(synth, utterance);
  };
  if (synth.speaking || synth.pending) {
    window.setTimeout(run, 80);
  } else {
    run();
  }
}

/** Speak a short Greek line on the waiter phone. */
export function speakGreekLine(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;

  try {
    unlockWaiterAudio();
    if (isIosDevice()) {
      void speakGreekLineViaServerAudio(trimmed).then((ok) => {
        if (!ok) speakGreekLineViaWebSpeech(trimmed);
      });
      return;
    }
    speakGreekLineViaWebSpeech(trimmed);
  } catch {
    /* autoplay / unsupported browser */
  }
}

export type SpeakPassMessageInput = PassAnnouncementLocation & PassAnnouncementOptions;

/** Speak a pass alert: new message + space + table (Greek). */
export function speakPassMessage(input: SpeakPassMessageInput): void {
  const text = buildPassSignalAnnouncement(input, {
    zoneGroups: input.zoneGroups,
    activeZoneId: input.activeZoneId,
  });
  if (!text.trim()) return;
  speakGreekLine(text);
}

/** iOS loads voices async — warm up once after user gesture elsewhere on page. */
export function primeWaiterVoice(): void {
  unlockWaiterAudio();
}
