import { formatMessage } from "@/lib/format-message";

export function resolveAuthError(
  data: { error?: string; code?: string; retryAfterSeconds?: number },
  errors: Record<string, string>,
  fallback: string,
): string {
  if (data.code === "cooldown" && data.retryAfterSeconds != null && errors.cooldown) {
    return formatMessage(errors.cooldown, { s: data.retryAfterSeconds });
  }
  if (data.code && errors[data.code]) return errors[data.code]!;
  return fallback;
}
