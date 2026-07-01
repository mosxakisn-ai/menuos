const ATHENS_TZ = "Europe/Athens";

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
  const noonUtc = new Date(`${y}-${m}-${d}T12:00:00.000Z`);
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
