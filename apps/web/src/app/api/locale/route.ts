import { LOCALE_COOKIE, resolveLocale } from "@/i18n/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { locale } = (await req.json()) as { locale?: string };
    const resolved = resolveLocale(locale);
    const res = NextResponse.json({ ok: true, locale: resolved });
    res.cookies.set(LOCALE_COOKIE, resolved, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
}
