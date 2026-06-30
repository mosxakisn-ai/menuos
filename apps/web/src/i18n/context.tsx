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
import { useRouter } from "next/navigation";
import { loadClientMessages } from "@/i18n/load-client-messages";
import type { MenuOsMessages } from "@/i18n/get-messages";
import { LOCALE_LABELS, LOCALES, resolveLocale, type Locale } from "@/i18n/types";

type I18nContextValue = {
  locale: Locale;
  m: MenuOsMessages;
  setLocale: (locale: Locale) => Promise<boolean>;
  locales: Locale[];
  localeLabels: typeof LOCALE_LABELS;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale: Locale;
  initialMessages: MenuOsMessages;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<MenuOsMessages>(initialMessages);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (locale === initialLocale) setMessages(initialMessages);
  }, [initialLocale, initialMessages, locale]);

  const setLocale = useCallback(
    async (next: Locale): Promise<boolean> => {
      if (next === locale) return true;
      try {
        const nextMessages = await loadClientMessages(next);
        const res = await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        if (!res.ok) throw new Error("locale_update_failed");
        setLocaleState(next);
        setMessages(nextMessages);
        router.refresh();
        return true;
      } catch {
        return false;
      }
    },
    [locale, router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      m: messages,
      setLocale,
      locales: LOCALES,
      localeLabels: LOCALE_LABELS,
    }),
    [locale, messages, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useI18nOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}

export { resolveLocale };
