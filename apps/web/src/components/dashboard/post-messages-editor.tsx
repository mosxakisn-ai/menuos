"use client";

import { Plus, Trash2 } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { dashboardFieldClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { DEFAULT_POST_MESSAGE_COLORS } from "@menuos/shared";

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
        <p className="text-sm text-slate-400">{emptyHint ?? "—"}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((label) => (
            <li
              key={label}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
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
  /** Commit text still in the add field (e.g. before panel save). */
  flushPending: () => void;
};

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
  },
  ref,
) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

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
    if (!value) {
      onChange(items.filter((_, i) => i !== index));
    } else {
      const next = items.map((item, i) => (i === index ? value : item));
      onChange([...new Set(next)]);
    }
    setEditingIndex(null);
    setEditDraft("");
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditDraft("");
    }
  }

  function addItem(forceValue?: string) {
    const value = (forceValue ?? draft).trim();
    if (!value || items.includes(value) || items.length >= maxItems) return false;
    onChange([...items, value]);
    setDraft("");
    setAddFieldOpen(true);
    return true;
  }

  useImperativeHandle(ref, () => ({
    flushPending: () => {
      addItem();
    },
  }));

  return (
    <div className="space-y-3">
      {items.length === 0 && !hideAddRow ? (
        <p className="text-sm text-slate-400">{placeholder}</p>
      ) : items.length > 0 ? (
        items.map((item, index) => (
          <div key={`${index}-${item}`} className="flex gap-2">
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
              className={`${dashboardFieldClass} min-w-0 flex-1 text-sm`}
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${item}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))
      ) : null}
      {!hideAddRow && items.length < maxItems ? (
        <div className="flex flex-wrap gap-2 pt-1">
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
            placeholder={placeholder}
            maxLength={60}
            className={`${dashboardFieldClass} min-w-[min(100%,14rem)] flex-1 text-sm`}
          />
          <button
            type="button"
            onClick={() => addItem()}
            disabled={!draft.trim()}
            className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
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
