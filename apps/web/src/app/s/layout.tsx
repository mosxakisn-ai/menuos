import { cookies } from "next/headers";
import { DashboardLocaleProvider } from "@/components/dashboard/dashboard-locale-provider";
import { DASHBOARD_LANG_COOKIE, parseDashboardLang } from "@/content/dashboard-i18n";

export const dynamic = "force-dynamic";

export default async function StaffWaiterLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialLang = parseDashboardLang(cookieStore.get(DASHBOARD_LANG_COOKIE)?.value);

  return <DashboardLocaleProvider initialLang={initialLang}>{children}</DashboardLocaleProvider>;
}
