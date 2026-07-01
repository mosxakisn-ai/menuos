import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  DASHBOARD_LANG_COOKIE,
  getDashboardCopy,
  parseDashboardLang,
  type DashboardCopy,
} from "@/content/dashboard-i18n";
import { buildPrivatePageMetadata } from "@/lib/seo";

type DashboardMetaKey = keyof DashboardCopy["meta"];

export async function buildDashboardPageMetadata(
  metaKey: DashboardMetaKey,
  path: string,
): Promise<Metadata> {
  const cookie = (await cookies()).get(DASHBOARD_LANG_COOKIE)?.value;
  const lang = parseDashboardLang(cookie);
  const title = getDashboardCopy(lang).meta[metaKey];
  return buildPrivatePageMetadata(title, path);
}
