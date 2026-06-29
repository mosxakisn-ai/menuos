import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { APP_URL } from "@/lib/config";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", APP_URL));
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
