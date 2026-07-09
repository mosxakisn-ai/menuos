export type WaiterBeepKind = "pass" | "guest";

export type WaiterBeepTone = {
  freq: number;
  startMs: number;
  durationMs: number;
  gain: number;
};

/** Kitchen pass — triple ascending pager (cuts through restaurant noise). */
export const PASS_BEEP_TONES: readonly WaiterBeepTone[] = [
  { freq: 880, startMs: 0, durationMs: 140, gain: 0.42 },
  { freq: 1100, startMs: 180, durationMs: 140, gain: 0.45 },
  { freq: 1320, startMs: 360, durationMs: 160, gain: 0.48 },
];

/** Guest call / bill — two lower tones (distinct from pass). */
export const GUEST_BEEP_TONES: readonly WaiterBeepTone[] = [
  { freq: 660, startMs: 0, durationMs: 150, gain: 0.4 },
  { freq: 880, startMs: 220, durationMs: 180, gain: 0.42 },
];

const SAMPLE_RATE = 22050;

export function waiterBeepTones(kind: WaiterBeepKind): readonly WaiterBeepTone[] {
  return kind === "pass" ? PASS_BEEP_TONES : GUEST_BEEP_TONES;
}

function synthesizeBeepSamples(kind: WaiterBeepKind): Float32Array {
  const tones = waiterBeepTones(kind);
  const endMs = Math.max(...tones.map((t) => t.startMs + t.durationMs));
  const length = Math.ceil(((endMs + 80) / 1000) * SAMPLE_RATE);
  const out = new Float32Array(length);

  for (const tone of tones) {
    const startSample = Math.floor((tone.startMs / 1000) * SAMPLE_RATE);
    const durationSamples = Math.floor((tone.durationMs / 1000) * SAMPLE_RATE);
    for (let i = 0; i < durationSamples; i++) {
      const idx = startSample + i;
      if (idx >= out.length) break;
      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, i / (SAMPLE_RATE * 0.01));
      const release = Math.min(1, (durationSamples - i) / (SAMPLE_RATE * 0.025));
      const env = attack * release;
      const sample =
        env *
        tone.gain *
        (0.85 * Math.sin(2 * Math.PI * tone.freq * t) +
          0.15 * Math.sin(2 * Math.PI * tone.freq * 2 * t));
      out[idx] += sample;
    }
  }

  let peak = 0;
  for (const sample of out) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.98) {
    const scale = 0.98 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= scale;
  }

  return out;
}

function encodePcm16Wav(samples: Float32Array, sampleRate = SAMPLE_RATE): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]!));
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.floor(clamped * 32767))), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export function synthesizeWaiterBeepWav(kind: WaiterBeepKind): Buffer {
  return encodePcm16Wav(synthesizeBeepSamples(kind));
}

export function parseWaiterBeepKind(value: string | null | undefined): WaiterBeepKind {
  return value === "guest" ? "guest" : "pass";
}
