"use client";

import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { DashboardCopy } from "@/content/dashboard-i18n";
import { cn } from "@/lib/utils";

export function resolveApiError(
  data: { error?: string; code?: string },
  flash: DashboardCopy["flash"],
): string {
  if (data.code && flash.codes[data.code]) return flash.codes[data.code]!;
  return data.error ?? flash.genericError;
}

export type FlashMessage = {
  type: "success" | "info" | "error";
  text: string;
};

export function FlashMessages({
  initial,
  onClear,
}: {
  initial?: FlashMessage | null;
  onClear?: () => void;
}) {
  const { d } = useDashboardCopy();
  const [messages, setMessages] = useState<FlashMessage[]>(initial ? [initial] : []);

  useEffect(() => {
    if (initial) setMessages([initial]);
  }, [initial]);

  function dismiss(i: number) {
    setMessages((m) => m.filter((_, idx) => idx !== i));
    onClear?.();
  }

  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <div
          key={`${msg.text}-${i}`}
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-card border px-4 py-3 text-sm shadow-soft",
            msg.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
            msg.type === "info" && "border-brand-blue/20 bg-brand-blue/5 text-brand-navy",
            msg.type === "error" && "border-red-200 bg-red-50 text-red-900",
          )}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : msg.type === "error" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
          )}
          <p className="flex-1 leading-relaxed">{msg.text}</p>
          <button
            type="button"
            onClick={() => dismiss(i)}
            className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
            aria-label={d.flash.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useFlashMessage() {
  const { d } = useDashboardCopy();
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  const show = useCallback((type: FlashMessage["type"], text: string) => {
    setFlash({ type, text });
  }, []);

  const showFromResponse = useCallback(
    (data: { message?: string; error?: string; code?: string }, ok: boolean) => {
      if (data.message) setFlash({ type: "success", text: data.message });
      else if (data.error || data.code) setFlash({ type: "error", text: resolveApiError(data, d.flash) });
      else if (ok) setFlash({ type: "success", text: d.flash.success });
    },
    [d.flash],
  );

  return { flash, setFlash, show, showFromResponse };
}
