import { buildPassVoiceAnnouncement, translateMessageForVoice, type PassVoiceInput } from "@menuos/shared";

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === "en-US") ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    null
  );
}

function startSpeech(synth: SpeechSynthesis, utterance: SpeechSynthesisUtterance) {
  const voice = pickEnglishVoice();
  if (voice) {
    utterance.voice = voice;
    synth.speak(utterance);
    return;
  }

  let spoke = false;
  const speakOnce = () => {
    if (spoke) return;
    spoke = true;
    const loaded = pickEnglishVoice();
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

/** Speak a short English line on the waiter phone (Web Speech API). */
export function speakEnglishLine(text: string): void {
  if (typeof window === "undefined") return;
  const trimmed = text.trim();
  if (!trimmed) return;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    startSpeech(synth, utterance);
  } catch {
    /* autoplay / unsupported browser */
  }
}

/** Preview how a Greek preset will sound in English (settings → Μηνύματα). */
export function speakMessagePreview(greekMessage: string): void {
  const english = translateMessageForVoice(greekMessage);
  if (!english) return;
  speakEnglishLine(english);
}

/** Speak a pass alert with table/spot context. */
export function speakPassMessage(input: PassVoiceInput): void {
  const text = buildPassVoiceAnnouncement(input);
  if (!text) return;
  speakEnglishLine(text);
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
