/** Greek trial-period labels for marketing copy ({trialDays} placeholders). */
export function trialDayLabels(days: number) {
  const n = Math.max(1, Math.round(days));
  if (n === 1) {
    return {
      trialDays: "1 ημέρα",
      trialDaysGen: "1 ημέρας",
      trialDaysAdj: "1ήμερη",
    };
  }
  return {
    trialDays: `${n} ημέρες`,
    trialDaysGen: `${n} ημερών`,
    trialDaysAdj: `${n}ήμερη`,
  };
}

export function formatTrialPeriodLabel(days: number): string {
  return ` / ${trialDayLabels(days).trialDays}`;
}

export function applyTrialDayPlaceholders(text: string, days: number): string {
  const labels = trialDayLabels(days);
  return text
    .replaceAll("{trialDays}", labels.trialDays)
    .replaceAll("{trialDaysGen}", labels.trialDaysGen)
    .replaceAll("{trialDaysAdj}", labels.trialDaysAdj);
}

export function applyTrialDayPlaceholdersDeep<T>(value: T, days: number): T {
  if (typeof value === "string") {
    return applyTrialDayPlaceholders(value, days) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => applyTrialDayPlaceholdersDeep(item, days)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = applyTrialDayPlaceholdersDeep(nested, days);
    }
    return out as T;
  }
  return value;
}
