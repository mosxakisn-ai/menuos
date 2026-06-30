import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushEnabled } from "@/lib/push-config";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!isPushEnabled() || !publicKey) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({ enabled: true, publicKey });
}
