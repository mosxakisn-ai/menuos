"use client";

import { useEffect } from "react";
import { reportClientDiagnostic } from "@/lib/report-client-diagnostic";

import { inferDiagnosticCategoryFromPath } from "@/lib/diagnostic-category";

/** Captures dashboard JS errors silently for MenuOS Ops Help Desk. */
export function DashboardDiagnosticsReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientDiagnostic({
        severity: "ERROR",
        source: "client",
        category: inferDiagnosticCategoryFromPath(window.location.pathname),
        message: event.message || "Unhandled error",
        stack: event.error?.stack ?? null,
        context: {
          url: window.location.href,
          line: event.lineno,
          col: event.colno,
        },
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      reportClientDiagnostic({
        severity: "ERROR",
        source: "client",
        category: inferDiagnosticCategoryFromPath(window.location.pathname),
        message,
        stack: reason instanceof Error ? reason.stack ?? null : null,
        context: { url: window.location.href },
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
