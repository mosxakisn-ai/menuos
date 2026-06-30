import { TRIAL_DAYS } from "./plans";

export type TrialUrgency = "healthy" | "mid" | "ending" | "last_day" | "expired";

/** Whole calendar days until trialEndsAt (ceil). 0 = last day, negative = expired. */
export function getTrialDaysLeft(trialEndsAt: Date, now = new Date()): number {
  return Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function isTrialPlan(plan: string): boolean {
  return plan === "TRIAL";
}

export function isTrialStillActive(trialEndsAt: Date | null | undefined, now = new Date()): boolean {
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > now.getTime();
}

export function getTrialUrgency(daysLeft: number): TrialUrgency {
  if (daysLeft <= 0) return "expired";
  if (daysLeft === 1) return "last_day";
  if (daysLeft <= 3) return "ending";
  if (daysLeft <= 4) return "mid";
  return "healthy";
}

export function formatTrialDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return "Έληξε";
  if (daysLeft === 1) return "1 μέρα απομένει";
  return `${daysLeft} μέρες απομένουν`;
}

/** Whole calendar days in a trial window (e.g. signup → trialEndsAt). */
export function getTrialPeriodDays(trialEndsAt: Date, startedAt: Date): number {
  const ms = trialEndsAt.getTime() - startedAt.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export { TRIAL_DAYS };
