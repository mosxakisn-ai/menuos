import { NextResponse } from "next/server";
import { parseWaiterBeepKind, synthesizeWaiterBeepWav } from "@/lib/waiter-beep-audio";

/** Alert WAV for push notification sound + service worker background beep. */
export async function GET(request: Request) {
  const kind = parseWaiterBeepKind(new URL(request.url).searchParams.get("kind"));
  const wav = synthesizeWaiterBeepWav(kind);

  return new NextResponse(new Uint8Array(wav), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
