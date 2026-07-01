"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DASHBOARD_LANG_COOKIE,
  DASHBOARD_LANG_STORAGE,
  getDashboardCopy,
  parseDashboardLang,
  planLabelForLang,
  roleLabelForLang,
  type DashboardCopy,
  type DashboardLang,
} from "@/content/dashboard-i18n";

type DashboardLocaleContextValue = {
  lang: DashboardLang;
  setLang: (lang: DashboardLang) => void;
  d: DashboardCopy;
  planLabel: (planId: string) => string;
  roleLabel: (role: string) => string;
};

const DashboardLocaleContext = createContext<DashboardLocaleContextValue | null>(null);

function persistLang(lang: DashboardLang) {
  try {
    localStorage.setItem(DASHBOARD_LANG_STORAGE, lang);
  } catch {
    /* ignore */
  }
  document.cookie = `${DASHBOARD_LANG_COOKIE}=${lang};path=/;max-age=31536000;SameSite=Lax`;
}

export function DashboardLocaleProvider({
  initialLang,
  children,
}: {
  initialLang: DashboardLang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<DashboardLang>(initialLang);

  useEffect(() => {
    try {
      const cookieMatch = document.cookie.match(
        new RegExp(`${DASHBOARD_LANG_COOKIE}=([^;]+)`),
      );
      const cookieLang = cookieMatch?.[1] ? parseDashboardLang(cookieMatch[1]) : null;
      const stored = localStorage.getItem(DASHBOARD_LANG_STORAGE);
      const lang = cookieLang ?? (stored ? parseDashboardLang(stored) : initialLang);
      setLangState(lang);
      persistLang(lang);
    } catch {
      /* ignore */
    }
  }, [initialLang]);

  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      d: getDashboardCopy(lang),
      planLabel: (planId: string) => planLabelForLang(lang, planId),
      roleLabel: (role: string) => roleLabelForLang(lang, role),
    }),
    [lang, setLang],
  );

  return <DashboardLocaleContext.Provider value={value}>{children}</DashboardLocaleContext.Provider>;
}

export function useDashboardCopy() {
  const ctx = useContext(DashboardLocaleContext);
  if (!ctx) {
    throw new Error("useDashboardCopy must be used within DashboardLocaleProvider");
  }
  return ctx;
}
