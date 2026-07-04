import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALE_REQUEST_HEADER, resolveLocale } from "@/i18n/types";
import { SESSION_COOKIE } from "@/lib/config";
import { verifySessionToken } from "@/lib/auth";
import { loginUrlWithCallback } from "@/lib/safe-callback-url";
import { SUPERVISOR_COOKIE } from "@/lib/supervisor-auth-constants";
import { verifySupervisorTokenEdge } from "@/lib/supervisor-auth-edge";
import { isStaffRestrictedDashboardPath } from "@/lib/dashboard-roles";
import { ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";
import {
  checkSitemapAccess,
  isSitemapGuardPath,
  sitemapGuardClientIp,
} from "@/lib/sitemap-crawler-guard";

const TRIAL_EXEMPT_PREFIXES = ["/dashboard/billing"];

/** QR menu uses ?lang= for dish UI — not marketing site locale. */
function isPublicMenuPath(pathname: string): boolean {
  return pathname.startsWith("/m/");
}

function applyLocale(request: NextRequest, response: NextResponse): NextResponse {
  if (isPublicMenuPath(request.nextUrl.pathname)) return response;
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

function indexNowKeyResponse(pathname: string): NextResponse | null {
  const indexNowKey = process.env.INDEXNOW_KEY;
  if (!indexNowKey || pathname !== `/${indexNowKey}.txt`) return null;
  return new NextResponse(indexNowKey, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const indexNow = indexNowKeyResponse(pathname);
  if (indexNow) return indexNow;

  if (isSitemapGuardPath(pathname)) {
    const access = checkSitemapAccess({
      ip: sitemapGuardClientIp(
        request.headers.get("x-forwarded-for"),
        request.headers.get("x-real-ip"),
      ),
      pathname,
      userAgent: request.headers.get("user-agent"),
    });
    if (!access.allowed) {
      return new NextResponse("Too many requests. Try again later.", {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": String(access.retryAfterSec),
        },
      });
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-menuos-pathname", pathname);
  if (request.nextUrl.search) {
    requestHeaders.set("x-menuos-search", request.nextUrl.search);
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam && !isPublicMenuPath(pathname)) {
    requestHeaders.set(LOCALE_REQUEST_HEADER, resolveLocale(langParam));
  }

  let response: NextResponse;

  if (pathname.startsWith("/supervisor")) {
    if (pathname === "/supervisor/login") {
      const token = request.cookies.get(SUPERVISOR_COOKIE)?.value;
      if (token && (await verifySupervisorTokenEdge(token))) {
        const next = request.nextUrl.searchParams.get("next");
        const target =
          next && next.startsWith("/supervisor") ? next : "/supervisor";
        response = NextResponse.redirect(new URL(target, request.url));
        return applyLocale(request, response);
      }
      response = NextResponse.next({ request: { headers: requestHeaders } });
      return applyLocale(request, response);
    }

    const token = request.cookies.get(SUPERVISOR_COOKIE)?.value;
    if (!token || !(await verifySupervisorTokenEdge(token))) {
      const login = new URL("/supervisor/login", request.url);
      login.searchParams.set("next", pathname + request.nextUrl.search);
      response = NextResponse.redirect(login);
      return applyLocale(request, response);
    }
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else if (pathname.startsWith("/dashboard")) {
    const returnTo = pathname + request.nextUrl.search;
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      response = NextResponse.redirect(new URL(loginUrlWithCallback(returnTo), request.url));
      return applyLocale(request, response);
    }
    const session = await verifySessionToken(token);
    if (!session) {
      response = NextResponse.redirect(new URL(loginUrlWithCallback(returnTo), request.url));
      return applyLocale(request, response);
    }

    const trialExempt = TRIAL_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!trialExempt) {
      requestHeaders.set("x-menuos-check-subscription", "1");
    }

    if (session.role === "STAFF" && (pathname === "/dashboard" || isStaffRestrictedDashboardPath(pathname))) {
      response = NextResponse.redirect(new URL("/dashboard/waiter", request.url));
      return applyLocale(request, response);
    }

    response = NextResponse.next({ request: { headers: requestHeaders } });
    if (session.role !== "STAFF" && pathname.startsWith("/dashboard/qr")) {
      response.cookies.set(ONBOARDING_QR_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      });
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  return applyLocale(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
