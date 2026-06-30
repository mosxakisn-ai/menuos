import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_REQUEST_HEADER, resolveLocale } from "@/i18n/types";
import { SESSION_COOKIE } from "@/lib/config";
import { verifySessionToken } from "@/lib/auth";

const TRIAL_EXEMPT_PREFIXES = ["/dashboard/billing"];

function applyLocale(request: NextRequest, response: NextResponse): NextResponse {
  const langParam = request.nextUrl.searchParams.get("lang");
  if (!langParam) return response;
  const locale = resolveLocale(langParam);
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60,
  });
  response.headers.set(LOCALE_REQUEST_HEADER, locale);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-menuos-pathname", pathname);

  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam) {
    requestHeaders.set(LOCALE_REQUEST_HEADER, resolveLocale(langParam));
  }

  let response: NextResponse;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      response = NextResponse.redirect(new URL("/login", request.url));
      return applyLocale(request, response);
    }
    const session = await verifySessionToken(token);
    if (!session) {
      response = NextResponse.redirect(new URL("/login", request.url));
      return applyLocale(request, response);
    }

    const trialExempt = TRIAL_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!trialExempt) {
      requestHeaders.set("x-menuos-check-subscription", "1");
    }
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  return applyLocale(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
