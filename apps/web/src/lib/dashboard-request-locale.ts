import { cookies } from "next/headers";
import {
  DASHBOARD_LANG_COOKIE,
  getDashboardCopy,
  parseDashboardLang,
  type DashboardCopy,
  type DashboardLang,
} from "@/content/dashboard-i18n";

export function dashboardLangFromCookieHeader(cookieHeader: string | null | undefined): DashboardLang {
  if (!cookieHeader) return "EN";
  const match = cookieHeader.match(new RegExp(`${DASHBOARD_LANG_COOKIE}=([^;]+)`));
  return parseDashboardLang(match?.[1]);
}

export function dashboardLangFromRequest(request: Request): DashboardLang {
  return dashboardLangFromCookieHeader(request.headers.get("cookie"));
}

export async function dashboardLangFromServerCookies(): Promise<DashboardLang> {
  const cookieStore = await cookies();
  return parseDashboardLang(cookieStore.get(DASHBOARD_LANG_COOKIE)?.value);
}

export function dashboardCopyFromRequest(request: Request): DashboardCopy {
  return getDashboardCopy(dashboardLangFromRequest(request));
}

export async function dashboardCopyFromServerCookies(): Promise<DashboardCopy> {
  return getDashboardCopy(await dashboardLangFromServerCookies());
}
