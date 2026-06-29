import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config";
import { verifySessionToken } from "@/lib/auth";

const TRIAL_EXEMPT_PREFIXES = ["/dashboard/billing"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-menuos-pathname", pathname);

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const trialExempt = TRIAL_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!trialExempt) {
      requestHeaders.set("x-menuos-check-subscription", "1");
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
