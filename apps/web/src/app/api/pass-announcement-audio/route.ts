import { NextResponse } from "next/server";
import {
  announcementAudioCacheKey,
  getPassAnnouncementAudio,
  normalizeAnnouncementText,
} from "@/lib/pass-announcement-audio";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const text = normalizeAnnouncementText(
    new URL(request.url).searchParams.get("text") ?? "",
  );
  if (!text) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  }

  const ip = clientIp(request);
  const rate = await checkRateLimitOutcome(`pass-tts:${ip}`, 40, 60_000);
  if (rate === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (rate === "limited") {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const wav = await getPassAnnouncementAudio(text);
    return new NextResponse(new Uint8Array(wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400, immutable",
        ETag: `"${announcementAudioCacheKey(text)}"`,
      },
    });
  } catch (err) {
    console.error("[menuos] pass-announcement-audio failed", err);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
