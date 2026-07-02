/** Client-side API errors we skip in Help Desk (validation / auth noise). */
const SKIP_CLIENT_DIAGNOSTIC_CODES = new Set([
  "invalid_input",
  "bad_request",
  "rate_limited",
  "invalid_credentials",
  "unauthorized",
  "forbidden",
]);

export function shouldReportClientApiError(
  data: { error?: string; code?: string; diagnosticLogged?: boolean },
  status?: number,
): boolean {
  if (data.diagnosticLogged) return false;
  if (status !== undefined && status >= 500) return true;
  if (data.code && SKIP_CLIENT_DIAGNOSTIC_CODES.has(data.code)) return false;
  if (status !== undefined && status >= 400 && (data.error || data.code)) return true;
  // Safety net when callers omit HTTP status but API returned an error code.
  if (status === undefined && data.code) return true;
  if (data.error) return true;
  return false;
}
