"use client";

type ClientDiagnosticPayload = {
  severity?: "INFO" | "WARN" | "ERROR";
  source: string;
  category: string;
  message: string;
  errorCode?: string | null;
  stack?: string | null;
  context?: Record<string, unknown> | null;
};

/** Silent client-side report — never shown to the customer. */
export function reportClientDiagnostic(payload: ClientDiagnosticPayload): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/diagnostics/report", blob)) return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/diagnostics/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}
