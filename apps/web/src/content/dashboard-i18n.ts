import { DASHBOARD_EL } from "@/content/dashboard-el";
import { DASHBOARD_EN } from "@/content/dashboard-en";

export type DashboardLang = "GR" | "EN";

/** Widen literal strings so GR/EN objects share one copy type. */
type WidenCopy<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => WidenCopy<R>
  : T extends string
    ? string
    : T extends readonly (infer U)[]
      ? readonly WidenCopy<U>[]
      : T extends object
        ? { [K in keyof T]: WidenCopy<T[K]> }
        : T;

export type DashboardCopy = WidenCopy<typeof DASHBOARD_EL>;

const COPY: Record<DashboardLang, DashboardCopy> = {
  GR: DASHBOARD_EL,
  EN: DASHBOARD_EN,
};

export const DASHBOARD_LANG_COOKIE = "menuos-dashboard-lang";
export const DASHBOARD_LANG_STORAGE = "menuos-dashboard-lang";

export function parseDashboardLang(value: string | null | undefined): DashboardLang {
  return value === "GR" ? "GR" : "EN";
}

export function getDashboardCopy(lang: DashboardLang): DashboardCopy {
  return COPY[lang];
}

export function planLabelForLang(lang: DashboardLang, planId: string): string {
  return getDashboardCopy(lang).planLabels[planId] ?? planId;
}

export function roleLabelForLang(lang: DashboardLang, role: string): string {
  return getDashboardCopy(lang).roleLabels[role] ?? role;
}

export function formatDashboardDate(lang: DashboardLang, date: Date): string {
  return date.toLocaleDateString(lang === "EN" ? "en-GB" : "el-GR");
}

/** @deprecated Use getDashboardCopy(lang) in UI; kept for API routes. */
export function planLabel(planId: string): string {
  return planLabelForLang("GR", planId);
}

/** @deprecated Use roleLabelForLang(lang, role) in UI; kept for API routes. */
export function roleLabel(role: string): string {
  return roleLabelForLang("GR", role);
}
