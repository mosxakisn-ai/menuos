const ATHENS_TZ = "Europe/Athens";

const ATHENS_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD for the current calendar day in Europe/Athens. */
export function athensTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ATHENS_TZ }).format(now);
}

function startOfAthensDayFromParts(y: string, m: string, d: string): Date {
  const noonUtc = new Date(`${y}-${m}-${d}T12:00:00.000Z`);
  if (Number.isNaN(noonUtc.getTime())) {
    throw new Error("invalid date");
  }
  const athensHourAtNoon = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: ATHENS_TZ,
      hour: "numeric",
      hour12: false,
    }).format(noonUtc),
  );
  const offsetMs = (athensHourAtNoon - 12) * 3_600_000;
  return new Date(noonUtc.getTime() - 12 * 3_600_000 - offsetMs);
}

/** Start of a calendar day (YYYY-MM-DD) in Europe/Athens. */
export function startOfAthensDay(dateYmd: string): Date {
  const match = ATHENS_DATE_RE.exec(dateYmd.trim());
  if (!match) throw new Error("invalid date");
  return startOfAthensDayFromParts(match[1]!, match[2]!, match[3]!);
}

/** Inclusive start, exclusive end — for Prisma deliveredAt filters. */
export function athensDayBounds(dateYmd: string): { gte: Date; lt: Date } {
  const gte = startOfAthensDay(dateYmd);
  return { gte, lt: new Date(gte.getTime() + 24 * 60 * 60 * 1000) };
}

/** First calendar day (YYYY-MM-DD) included in a N-day window ending today (Athens). */
export function athensPeriodStartYmd(days: number, now = new Date()): string {
  const span = Math.max(1, Math.floor(days));
  const anchor = startOfTodayAthens(now);
  return athensTodayYmd(new Date(anchor.getTime() - (span - 1) * 24 * 60 * 60 * 1000));
}

/** Whether dateYmd falls inside the last `days` Athens calendar days (inclusive). */
export function isAthensDateInPeriod(dateYmd: string, days: number, now = new Date()): boolean {
  const today = athensTodayYmd(now);
  const start = athensPeriodStartYmd(days, now);
  return dateYmd >= start && dateYmd <= today;
}

/** Start of the current calendar day in Europe/Athens (for pass-signal daily counts). */
export function startOfTodayAthens(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ATHENS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return startOfAthensDayFromParts(y, m, d);
}
