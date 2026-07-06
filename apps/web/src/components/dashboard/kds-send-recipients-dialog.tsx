"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Smartphone, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type KdsPassRecipient = {
  id: string;
  name: string;
  roleLabel: string;
  zoneLabel: string;
  postLabel: string;
};

const DIALOG_COPY = {
  title: "Σε ποιον στέλνουμε;",
  hint: "Μόνο σερβιτόροι του σωστού χώρου — με το δικό τους link στο κινητό.",
  all: "Όλοι",
  empty: "Δεν βρέθηκε σερβιτόρος για αυτόν τον χώρο. Το μήνυμα θα φαίνεται στις Οθόνες.",
  cancel: "Ακύρωση",
  send: "Αποστολή",
  sendCount: (n: number) => `Αποστολή (${n})`,
  loading: "Φόρτωση προσωπικού…",
};

export function KdsSendRecipientsDialog({
  open,
  loading,
  recipients,
  zoneLabel,
  tableLabel,
  message,
  sending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  recipients: KdsPassRecipient[];
  zoneLabel: string | null;
  tableLabel: string | null;
  message: string;
  sending: boolean;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(recipients.map((row) => row.id)));
  }, [open, recipients]);

  const allSelected = recipients.length > 0 && selected.size === recipients.length;
  const subtitle = useMemo(() => {
    const parts: string[] = [];
    if (zoneLabel && tableLabel) parts.push(`${zoneLabel} · ${tableLabel}`);
    else if (tableLabel) parts.push(tableLabel);
    if (message.trim()) parts.push(`«${message.trim()}»`);
    return parts.join(" · ");
  }, [zoneLabel, tableLabel, message]);

  if (!open) return null;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(recipients.map((row) => row.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canConfirm = !sending && !loading && (recipients.length === 0 || selected.size > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kds-send-dialog-title"
    >
      <div className="flex max-h-[min(88dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="kds-send-dialog-title" className="text-lg font-bold text-white">
              {DIALOG_COPY.title}
            </h2>
            {subtitle ? (
              <p className="mt-1 truncate text-sm text-cyan-200/90">{subtitle}</p>
            ) : null}
            <p className="mt-1.5 text-xs leading-snug text-slate-400">{DIALOG_COPY.hint}</p>
          </div>
          <button
            type="button"
            aria-label={DIALOG_COPY.cancel}
            disabled={sending}
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">{DIALOG_COPY.loading}</p>
          ) : recipients.length === 0 ? (
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-4 text-sm leading-snug text-amber-100">
              {DIALOG_COPY.empty}
            </p>
          ) : (
            <>
              <button
                type="button"
                disabled={sending}
                onClick={toggleAll}
                className={cn(
                  "mb-3 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition active:scale-[0.99]",
                  allSelected
                    ? "border-cyan-400/60 bg-cyan-500/15 text-white"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-white/25",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    allSelected ? "bg-cyan-500/25 text-cyan-200" : "bg-white/10 text-slate-400",
                  )}
                >
                  <Users className="h-4 w-4" />
                </span>
                <span className="flex-1 font-semibold">
                  {DIALOG_COPY.all}
                  <span className="ml-1.5 text-sm font-normal text-slate-400">({recipients.length})</span>
                </span>
                {allSelected ? <Check className="h-5 w-5 shrink-0 text-cyan-300" /> : null}
              </button>

              <ul className="space-y-2">
                {recipients.map((row) => {
                  const picked = selected.has(row.id);
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => toggleOne(row.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition active:scale-[0.99]",
                          picked
                            ? "border-cyan-400/50 bg-cyan-500/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.2)]"
                            : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            picked ? "bg-cyan-500/20 text-cyan-200" : "bg-white/10 text-slate-500",
                          )}
                        >
                          <Smartphone className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{row.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-400">
                            {row.roleLabel} · {row.zoneLabel} · {row.postLabel}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                            picked
                              ? "border-cyan-400 bg-cyan-500 text-slate-950"
                              : "border-white/20 bg-transparent",
                          )}
                        >
                          {picked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={sending}
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {DIALOG_COPY.cancel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm(
                recipients.length === 0 || allSelected
                  ? recipients.map((row) => row.id)
                  : [...selected],
              )
            }
            className="flex-[1.35] rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-40"
          >
            {sending
              ? "…"
              : recipients.length === 0
                ? DIALOG_COPY.send
                : allSelected
                  ? DIALOG_COPY.send
                  : DIALOG_COPY.sendCount(selected.size)}
          </button>
        </div>
      </div>
    </div>
  );
}
