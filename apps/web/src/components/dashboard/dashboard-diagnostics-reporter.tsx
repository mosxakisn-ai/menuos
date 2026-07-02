"use client";

import { useEffect } from "react";
import { reportClientDiagnostic } from "@/lib/report-client-diagnostic";

function categoryFromPath(pathname: string): string {
  if (pathname.includes("/menus/import")) return "pdf_import";
  if (pathname.includes("/menus")) return "catalog";
  if (pathname.includes("/billing")) return "billing";
  if (pathname.includes("/qr")) return "qr";
  if (pathname.includes("/waiter")) return "waiter";
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/dashboard")) return "dashboard";
  return "unknown";
}

/** Captures dashboard JS errors silently for MenuOS Ops Help Desk. */
export function DashboardDiagnosticsReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientDiagnostic({
        severity: "ERROR",
        source: "client",
        category: categoryFromPath(window.location.pathname),
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
        category: categoryFromPath(window.location.pathname),
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
