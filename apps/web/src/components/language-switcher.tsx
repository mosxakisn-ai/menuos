"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOCALE_FLAGS, type Locale } from "@/i18n/types";
import { useI18n } from "@/i18n/context";

export function LanguageSwitcher({
  compact,
  mini,
  className,
}: {
  compact?: boolean;
  mini?: boolean;
  className?: string;
}) {
  const { locale, setLocale, locales, localeLabels, m } = useI18n();
  const [localeError, setLocaleError] = useState(false);
  const useCode = compact || mini;

  const display = useCode ? (
    <>
      <span className="text-base leading-none" aria-hidden>
        {LOCALE_FLAGS[locale]}
      </span>
      <span className="font-semibold uppercase tracking-wide">{locale.toUpperCase()}</span>
      {mini ? <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden /> : null}
    </>
  ) : (
    <>
      <span className="text-base leading-none" aria-hidden>
        {LOCALE_FLAGS[locale]}
      </span>
      <span>{localeLabels[locale]}</span>
    </>
  );

  const shellClass = mini
    ? "min-w-[4.5rem] gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 shadow-soft"
    : compact
      ? "min-w-[5.5rem] gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 shadow-soft"
      : "gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-soft";

  return (
    <div className={`relative inline-flex shrink-0 flex-col items-end ${className ?? ""}`}>
      <div className="relative inline-flex shrink-0 items-center">
        <span className={`pointer-events-none flex items-center ${shellClass}`} aria-hidden>
          {display}
        </span>
        <select
          aria-label={locale === "el" ? "Γλώσσα" : "Language"}
          value={locale}
          onChange={(e) => {
            const next = e.target.value as Locale;
            void (async () => {
              const ok = await setLocale(next);
              if (!ok) {
                setLocaleError(true);
                window.setTimeout(() => setLocaleError(false), 4000);
              }
            })();
          }}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none border-0 bg-transparent text-transparent opacity-0 outline-none"
        >
          {locales.map((code) => (
            <option key={code} value={code} className="text-brand-navy">
              {LOCALE_FLAGS[code]} {useCode ? code.toUpperCase() : localeLabels[code]}
            </option>
          ))}
        </select>
      </div>
      {localeError ? (
        <p role="alert" className="mt-1 max-w-[12rem] text-right text-xs text-red-600">
          {m.pages.common.localeSwitchFailed}
        </p>
      ) : null}
    </div>
  );
}
