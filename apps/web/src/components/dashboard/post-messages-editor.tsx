"use client";

import { Plus, Trash2, Volume2 } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { dashboardFieldClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { DEFAULT_POST_MESSAGE_COLORS, canTranslateMessageForVoice } from "@menuos/shared";
import { primeWaiterVoice, speakMessagePreview } from "@/lib/waiter-voice";

const COLOR_PRESETS = [...DEFAULT_POST_MESSAGE_COLORS, "#0F172A", "#DC2626"];

export function PostColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {COLOR_PRESETS.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={`h-7 w-7 shrink-0 rounded-full transition hover:scale-105 ${
                selected
                  ? "ring-2 ring-brand-blue ring-offset-2"
                  : "ring-1 ring-slate-200/90 ring-offset-1"
              }`}
              style={{ backgroundColor: color }}
              aria-label={color}
              aria-pressed={selected}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PostMessagePreview({
  labels,
  color,
  title,
  emptyHint,
}: {
  labels: string[];
  color: string;
  title?: string;
  emptyHint?: string;
}) {
  const items = [...new Set(labels.filter(Boolean))];
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3">
      {title ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      ) : null}
      {items.length === 0 ? (
        <p className="text-left text-sm text-slate-400">{emptyHint ?? "—"}</p>
      ) : (
        <ul className="flex flex-wrap items-center justify-start gap-2">
          {items.map((label) => (
            <li
              key={label}
              className="rounded-full px-3 py-1 text-center text-[11px] font-semibold leading-snug"
              style={{
                backgroundColor: `${color}18`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Editable message list — add, edit inline, delete. */
export type MessageChipListHandle = {
  /** Commit pending text/edits and return the final list (for sync save). */
  flushPending: () => string[];
};

function messageChipSurfaceStyle(color: string | undefined, selected = false) {
  if (!color) return undefined;
  return {
    backgroundColor: selected ? `${color}28` : `${color}14`,
    color,
    border: `1px solid ${selected ? color : `${color}55`}`,
    boxShadow: selected ? `0 0 0 1px ${color}40` : undefined,
  } as const;
}

export const MessageChipList = forwardRef<
  MessageChipListHandle,
  {
    items: string[];
    onChange: (next: string[]) => void;
    placeholder: string;
    addLabel?: string;
    maxItems?: number;
    focusAdd?: boolean;
    onFocusAddHandled?: () => void;
    hideAddRow?: boolean;
    /** Post colour — chips styled like pass tablet, left-aligned in settings. */
    color?: string;
    listLabel?: string;
    voicePreviewLabel?: string;
  }
>(function MessageChipList(
  {
    items,
    onChange,
    placeholder,
    addLabel,
    maxItems = 12,
    focusAdd = false,
    onFocusAddHandled,
    hideAddRow = false,
    color,
    listLabel,
    voicePreviewLabel = "Listen in English",
  },
  ref,
) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    primeWaiterVoice();
  }, []);

  useEffect(() => {
    if (!focusAdd) return;
    setAddFieldOpen(true);
    queueMicrotask(() => addInputRef.current?.focus());
    onFocusAddHandled?.();
  }, [focusAdd, onFocusAddHandled]);

  function beginEdit(index: number) {
    setEditingIndex(index);
    setEditDraft(items[index] ?? "");
  }

  function commitEdit(index: number) {
    const value = editDraft.trim();
    let next: string[];
    if (!value) {
      next = itemsRef.current.filter((_, i) => i !== index);
    } else {
      next = [...new Set(itemsRef.current.map((item, i) => (i === index ? value : item)))];
    }
    itemsRef.current = next;
    onChange(next);
    setEditingIndex(null);
    setEditDraft("");
  }

  function removeAt(index: number) {
    const next = itemsRef.current.filter((_, i) => i !== index);
    itemsRef.current = next;
    onChange(next);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditDraft("");
    }
  }

  function addItem(forceValue?: string): string[] | null {
    const value = (forceValue ?? draft).trim();
    const current = itemsRef.current;
    if (!value || current.includes(value) || current.length >= maxItems) return null;
    const next = [...current, value];
    itemsRef.current = next;
    onChange(next);
    setDraft("");
    setAddFieldOpen(true);
    return next;
  }

  useImperativeHandle(ref, () => ({
    flushPending: () => {
      let next = itemsRef.current;
      if (editingIndex !== null) {
        const value = editDraft.trim();
        if (!value) {
          next = next.filter((_, i) => i !== editingIndex);
        } else {
          next = [...new Set(next.map((item, i) => (i === editingIndex ? value : item)))];
        }
        setEditingIndex(null);
        setEditDraft("");
      }
      const pending = draft.trim();
      if (pending && !next.includes(pending) && next.length < maxItems) {
        next = [...next, pending];
        setDraft("");
      }
      itemsRef.current = next;
      return next;
    },
  }));

  function previewVoice(index: number) {
    const text = editingIndex === index ? editDraft : items[index];
    if (!text?.trim() || !canTranslateMessageForVoice(text)) return;
    speakMessagePreview(text);
  }

  function previewText(index: number) {
    return editingIndex === index ? editDraft : items[index] ?? "";
  }

  const colored = Boolean(color);
  const chipInputClass = colored
    ? "w-full min-w-0 border-0 bg-transparent px-3 py-2.5 text-left text-sm font-semibold outline-none placeholder:font-normal placeholder:opacity-60"
    : `${dashboardFieldClass} min-w-0 flex-1 text-sm`;

  return (
    <div className="space-y-3">
      {listLabel ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{listLabel}</p>
      ) : null}

      {items.length === 0 && !hideAddRow ? (
        <p className="text-left text-sm text-slate-400">{placeholder}</p>
      ) : items.length > 0 ? (
        <ul className={colored ? "flex w-full max-w-lg flex-col gap-2.5" : "space-y-3"}>
          {items.map((item, index) => (
            <li key={`${index}-${item}`} className="flex min-w-0 items-stretch gap-2">
              <div
                className={
                  colored
                    ? "flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-start rounded-xl transition"
                    : "min-w-0 flex-1"
                }
                style={colored ? messageChipSurfaceStyle(color) : undefined}
              >
                <input
                  value={editingIndex === index ? editDraft : item}
                  onFocus={() => beginEdit(index)}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (editingIndex !== index) {
                      setEditingIndex(index);
                      setEditDraft(value);
                      return;
                    }
                    setEditDraft(value);
                  }}
                  onBlur={() => {
                    if (editingIndex === index) commitEdit(index);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEdit(index);
                    }
                  }}
                  maxLength={60}
                  className={chipInputClass}
                  style={colored ? { color } : undefined}
                />
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => previewVoice(index)}
                disabled={!canTranslateMessageForVoice(previewText(index))}
                className="inline-flex shrink-0 items-center justify-center self-center rounded-lg border border-slate-200 p-2 text-brand-blue transition hover:border-brand-blue/30 hover:bg-brand-blue/5 disabled:pointer-events-none disabled:opacity-40"
                aria-label={voicePreviewLabel}
                title={voicePreviewLabel}
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="inline-flex shrink-0 items-center justify-center self-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${item}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!hideAddRow && items.length < maxItems ? (
        <div
          className={
            colored
              ? "flex w-full max-w-lg flex-col gap-2 pt-1 sm:flex-row sm:items-stretch"
              : "flex flex-wrap gap-2 pt-1"
          }
        >
          <div
            className={
              colored
                ? "flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-start rounded-xl border border-dashed"
                : "min-w-0 flex-1"
            }
            style={
              colored
                ? {
                    borderColor: `${color}55`,
                    backgroundColor: `${color}08`,
                  }
                : undefined
            }
          >
            <input
              ref={addInputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              onBlur={() => {
                if (draft.trim()) addItem();
              }}
              placeholder={placeholder}
              maxLength={60}
              className={
                colored
                  ? "w-full border-0 bg-transparent px-3 py-2.5 text-left text-sm outline-none placeholder:text-slate-400"
                  : `${dashboardFieldClass} min-w-[min(100%,14rem)] flex-1 text-sm`
              }
              style={colored ? { color } : undefined}
            />
          </div>
          <button
            type="button"
            onClick={() => addItem()}
            disabled={!draft.trim()}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 ${buttonClass("primary", "sm")} ${
              colored ? "min-h-[2.75rem] px-4" : ""
            }`}
          >
            <Plus className="h-4 w-4" />
            {addLabel ?? "Add"}
          </button>
        </div>
      ) : hideAddRow && items.length < maxItems ? (
        addFieldOpen || items.length > 0 || draft.trim() ? (
          <input
            ref={addInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim()) {
                addItem();
                return;
              }
              if (items.length === 0) setAddFieldOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            maxLength={60}
            className={`${dashboardFieldClass} w-full text-sm`}
          />
        ) : null
      ) : null}
    </div>
  );
});
