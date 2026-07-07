import {
  buildPassSignalAnnouncement,
  type PassAnnouncementOptions,
  type PassAnnouncementLocation,
} from "@menuos/shared";

function pickGreekVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "el-GR") ??
    voices.find((voice) => voice.lang.startsWith("el")) ??
    null
  );
}

function startSpeech(synth: SpeechSynthesis, utterance: SpeechSynthesisUtterance) {
  const voice = pickGreekVoice();
  if (voice) {
    utterance.voice = voice;
    synth.speak(utterance);
    return;
  }

  let spoke = false;
  const speakOnce = () => {
    if (spoke) return;
    spoke = true;
    const loaded = pickGreekVoice();
    if (loaded) utterance.voice = loaded;
    synth.speak(utterance);
  };

  synth.addEventListener("voiceschanged", speakOnce);
  synth.getVoices();
  window.setTimeout(() => {
    synth.removeEventListener("voiceschanged", speakOnce);
    speakOnce();
  }, 400);
}

/** Speak a short Greek line on the waiter phone (Web Speech API). */
export function speakGreekLine(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "el-GR";
    utterance.rate = 1;
    utterance.pitch = 1;
    startSpeech(synth, utterance);
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
  speakGreekLine(text);
}

/** iOS loads voices async — warm up once after user gesture elsewhere on page. */
export function primeWaiterVoice(): void {
  if (typeof window === "undefined") return;
  try {
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.removeEventListener("voiceschanged", onVoices);
    synth.addEventListener("voiceschanged", onVoices);
  } catch {
    /* ignore */
  }
}
