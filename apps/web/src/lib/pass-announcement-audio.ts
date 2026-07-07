import { createHash } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

const MAX_ANNOUNCEMENT_CHARS = 160;
const ANNOUNCEMENT_PATTERN = /^[\p{L}\p{N}\s·.,;:!?()-]+$/u;

export function normalizeAnnouncementText(raw: string): string | null {
  const text = raw.trim().slice(0, MAX_ANNOUNCEMENT_CHARS);
  if (!text || !ANNOUNCEMENT_PATTERN.test(text)) return null;
  return text;
}

export function announcementAudioCacheKey(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

/** Short alert tone when espeak is unavailable (dev / fallback). */
export function fallbackAnnouncementWav(): Buffer {
  const sampleRate = 22050;
  const durationSec = 0.45;
  const samples = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 20) * Math.max(0, 1 - (t - 0.35) * 8);
    const sample =
      env *
      (0.35 * Math.sin(2 * Math.PI * 880 * t) + 0.25 * Math.sin(2 * Math.PI * 988 * t));
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.floor(sample * 32767))), i * 2);
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

let espeakAvailable: boolean | null = null;

async function hasEspeak(): Promise<boolean> {
  if (espeakAvailable !== null) return espeakAvailable;
  try {
    await execFileAsync("espeak-ng", ["--version"], {
      timeout: 2000,
    } as Parameters<typeof execFileAsync>[2]);
    espeakAvailable = true;
  } catch {
    espeakAvailable = false;
  }
  return espeakAvailable;
}

export async function synthesizePassAnnouncementWav(text: string): Promise<Buffer> {
  if (!(await hasEspeak())) return fallbackAnnouncementWav();

  const out = join(tmpdir(), `menuos-pass-tts-${randomUUID()}.wav`);
  try {
    await execFileAsync(
      "espeak-ng",
      ["-v", "el", "-s", "135", "-p", "45", "-a", "120", "-w", out, text],
      { timeout: 8000 } as Parameters<typeof execFileAsync>[2],
    );
    return await readFile(out);
  } finally {
    await unlink(out).catch(() => undefined);
  }
}

const audioCache = new Map<string, Buffer>();

export async function getPassAnnouncementAudio(text: string): Promise<Buffer> {
  const key = announcementAudioCacheKey(text);
  const cached = audioCache.get(key);
  if (cached) return cached;
  const wav = await synthesizePassAnnouncementWav(text);
  if (audioCache.size > 80) audioCache.clear();
  audioCache.set(key, wav);
  return wav;
}
