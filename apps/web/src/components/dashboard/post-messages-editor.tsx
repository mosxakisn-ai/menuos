"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-6 w-6 rounded-full ring-2 ring-offset-1 transition hover:scale-105"
            style={{
              backgroundColor: color,
              outline: value === color ? `2px solid ${color}` : undefined,
              outlineOffset: value === color ? 2 : undefined,
            }}
            aria-label={color}
            aria-pressed={value === color}
          />
        ))}
      </div>
    </div>
  );
}

export function PostMessagePreview({
  labels,
  color,
}: {
  labels: string[];
  color: string;
}) {
  const items = [...new Set(labels.filter(Boolean))];
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
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
  );
}

/** Editable message list — add, edit inline, delete. */
export function MessageChipList({
  items,
  onChange,
  placeholder,
  maxItems = 12,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  maxItems?: number;
}) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

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

  function addItem() {
    const value = draft.trim();
    if (!value || items.includes(value) || items.length >= maxItems) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
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
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${item}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {items.length < maxItems ? (
        <div className="flex gap-2">
          <input
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
            className={`${dashboardFieldClass} min-w-0 flex-1 text-sm`}
          />
          <button type="button" onClick={addItem} className={buttonClass("secondary", "sm")}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
