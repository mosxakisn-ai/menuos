import { buildPassVoiceAnnouncement, type PassVoiceInput } from "@menuos/shared";

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "en-US") ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null
  );
}

/** Speak a short English line on the waiter phone (Web Speech API). */
export function speakPassMessage(input: PassVoiceInput): void {
  if (typeof window === "undefined") return;
  const text = buildPassVoiceAnnouncement(input);
  if (!text) return;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    const voice = pickEnglishVoice();
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  } catch {
    /* autoplay / unsupported browser */
  }
}

/** iOS loads voices async — warm up once after user gesture elsewhere on page. */
export function primeWaiterVoice(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    /* ignore */
  }
}
