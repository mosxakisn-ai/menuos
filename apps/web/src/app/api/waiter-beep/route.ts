import { NextResponse } from "next/server";
import { fallbackAnnouncementWav } from "@/lib/pass-announcement-audio";

/** Short two-tone alert WAV for service worker background beep fallback. */
export async function GET() {
  const wav = fallbackAnnouncementWav();
  return new NextResponse(new Uint8Array(wav), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
