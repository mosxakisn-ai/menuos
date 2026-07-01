import type { Locale } from "@/i18n/types";

export type TrialDayLabels = {
  trialDays: string;
  trialDaysGen: string;
  trialDaysAdj: string;
};

/** Trial-period labels for marketing copy ({trialDays} placeholders). */
export function trialDayLabels(days: number, locale: Locale = "el"): TrialDayLabels {
  const n = Math.max(1, Math.round(days));
  if (locale === "en") {
    if (n === 1) {
      return { trialDays: "1 day", trialDaysGen: "1-day", trialDaysAdj: "1-day" };
    }
    return { trialDays: `${n} days`, trialDaysGen: `${n}-day`, trialDaysAdj: `${n}-day` };
  }
  if (n === 1) {
    return { trialDays: "1 ημέρα", trialDaysGen: "1 ημέρας", trialDaysAdj: "1ήμερη" };
  }
  return { trialDays: `${n} ημέρες`, trialDaysGen: `${n} ημερών`, trialDaysAdj: `${n}ήμερη` };
}

/** Label for auth copy templates (`{days}`) — genitive in GR, plain days in EN. */
export function trialDaysForAuth(locale: Locale, days: number): string {
  const labels = trialDayLabels(days, locale);
  return locale === "en" ? labels.trialDays : labels.trialDaysGen;
}

export function formatTrialPeriodLabel(days: number, locale: Locale = "el"): string {
  return ` / ${trialDayLabels(days, locale).trialDays}`;
}

export function applyTrialDayPlaceholders(
  text: string,
  days: number,
  locale: Locale = "el",
): string {
  const labels = trialDayLabels(days, locale);
  return text
    .replaceAll("{trialDays}", labels.trialDays)
    .replaceAll("{trialDaysGen}", labels.trialDaysGen)
    .replaceAll("{trialDaysAdj}", labels.trialDaysAdj);
}

export function applyTrialDayPlaceholdersDeep<T>(
  value: T,
  days: number,
  locale: Locale = "el",
): T {
  if (typeof value === "string") {
    return applyTrialDayPlaceholders(value, days, locale) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyTrialDayPlaceholdersDeep(item, days, locale)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = applyTrialDayPlaceholdersDeep(nested, days, locale);
    }
    return out as T;
  }
  return value;
}
