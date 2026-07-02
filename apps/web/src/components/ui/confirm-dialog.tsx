"use client";

import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import type { PendingConfirm } from "@/lib/confirm-dialog-store";
import {
  getPendingConfirmDialog,
  resolveConfirmDialog,
  subscribeConfirmDialog,
} from "@/lib/confirm-dialog-store";
import { cn } from "@/lib/utils";

function ConfirmDialogPanel({ pending }: { pending: PendingConfirm }) {
  const { d } = useDashboardCopy();
  const C = d.confirmDialog;
  const { content } = pending;
  const isDestructive = (content.variant ?? "destructive") === "destructive";
  const Icon = isDestructive ? AlertTriangle : ShieldAlert;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") resolveConfirmDialog(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label={C.close}
        className="absolute inset-0 bg-brand-navy/45 backdrop-blur-[3px] transition-opacity"
        onClick={() => resolveConfirmDialog(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)]",
          isDestructive ? "border-red-200/80" : "border-amber-200/80",
        )}
      >
        <div
          className={cn(
            "h-1",
            isDestructive
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-orange-400"
              : "bg-gradient-to-r from-amber-400 via-orange-400 to-brand-blue",
          )}
        />
        <div className="p-6 pb-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1",
                isDestructive
                  ? "bg-red-50 text-red-600 ring-red-100"
                  : "bg-amber-50 text-amber-700 ring-amber-100",
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              {content.eyebrow ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">
                  {content.eyebrow}
                </p>
              ) : null}
              <h2
                id="confirm-dialog-title"
                className="font-serif text-xl font-bold leading-snug text-brand-navy"
              >
                {content.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => resolveConfirmDialog(false)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={C.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div id="confirm-dialog-desc" className="mt-4 space-y-3">
            {content.description ? (
              <p className="text-sm leading-relaxed text-slate-600">{content.description}</p>
            ) : null}
            {content.bullets && content.bullets.length > 0 ? (
              <ul
                className={cn(
                  "space-y-2 rounded-card border px-4 py-3.5",
                  isDestructive
                    ? "border-red-100 bg-gradient-to-br from-red-50/90 to-rose-50/40"
                    : "border-amber-100 bg-amber-50/50",
                )}
              >
                {content.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        isDestructive ? "bg-red-500" : "bg-amber-500",
                      )}
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {content.note ? (
              <p className="rounded-card border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-sm font-medium leading-relaxed text-amber-950">
                {content.note}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => resolveConfirmDialog(false)}
            className={cn(buttonClass("secondary", "md"), "w-full sm:w-auto sm:min-w-[7.5rem]")}
          >
            {content.cancelLabel ?? C.cancel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => resolveConfirmDialog(true)}
            className={cn(
              "inline-flex w-full items-center justify-center rounded-button px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 sm:w-auto sm:min-w-[7.5rem]",
              isDestructive
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                : "btn-gradient",
            )}
          >
            {content.confirmLabel ??
              (isDestructive ? C.confirmDelete : C.confirmContinue)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Global confirm dialog — mount once in dashboard layout. */
export function ConfirmDialogHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(() => getPendingConfirmDialog());

  useEffect(() => subscribeConfirmDialog(setPending), []);

  useEffect(() => {
    if (!pending) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pending]);

  if (!pending) return null;
  return <ConfirmDialogPanel pending={pending} />;
}
