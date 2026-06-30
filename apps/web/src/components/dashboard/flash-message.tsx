"use client";

import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const API_ERROR_MESSAGES: Record<string, string> = {
  subscription_inactive: "Η συνδρομή σου δεν είναι ενεργή. Αναβάθμισε για να συνεχίσεις.",
  trial_expired: "Η δοκιμαστική περίοδος έληξε.",
  unauthorized: "Συνδέσου ξανά.",
  forbidden: "Δεν έχεις δικαίωμα.",
  venue_limit: "Έφτασες το όριο καταστημάτων του πλάνου σου. Δες τα πλάνα στη Συνδρομή.",
  menu_limit: "Έφτασες το όριο καταλόγων του πλάνου σου.",
  item_limit: "Έφτασες το όριο πιάτων του πλάνου σου.",
  not_found: "Δεν βρέθηκε.",
  enterprise_contact: "Επικοινώνησε μαζί μας για Enterprise τιμολόγηση.",
  stripe_not_configured: "Το σύστημα πληρωμών δεν είναι διαθέσιμο.",
};

export function resolveApiError(data: { error?: string; code?: string }): string {
  if (data.code && API_ERROR_MESSAGES[data.code]) return API_ERROR_MESSAGES[data.code];
  return data.error ?? "Κάτι πήγε στραβά.";
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
            aria-label="Κλείσιμο"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useFlashMessage() {
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  const show = useCallback((type: FlashMessage["type"], text: string) => {
    setFlash({ type, text });
  }, []);

  const showFromResponse = useCallback(
    (data: { message?: string; error?: string; code?: string }, ok: boolean) => {
      if (data.message) setFlash({ type: "success", text: data.message });
      else if (data.error || data.code) setFlash({ type: "error", text: resolveApiError(data) });
      else if (ok) setFlash({ type: "success", text: "Επιτυχία!" });
    },
    [],
  );

  return { flash, setFlash, show, showFromResponse };
}
