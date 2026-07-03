"use client";

import { isLatinOnlyMenuText } from "@menuos/shared";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { PDF_IMPORT_UNCATEGORIZED_CATEGORY, type ParsedMenuCategoryDraft, type ParsedMenuItemDraft } from "@menuos/shared";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { categoryHasIssues, itemHasIssues } from "@/lib/menu-import-review";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CATEGORY_TINTS = [
  { header: "from-sky-50/95 via-white to-sky-50/40", ring: "ring-sky-200/70", accent: "border-l-sky-400" },
  { header: "from-violet-50/95 via-white to-violet-50/40", ring: "ring-violet-200/70", accent: "border-l-violet-400" },
  { header: "from-emerald-50/95 via-white to-emerald-50/40", ring: "ring-emerald-200/70", accent: "border-l-emerald-400" },
  { header: "from-rose-50/95 via-white to-rose-50/40", ring: "ring-rose-200/70", accent: "border-l-rose-400" },
  { header: "from-amber-50/95 via-white to-amber-50/40", ring: "ring-amber-200/70", accent: "border-l-amber-400" },
  { header: "from-teal-50/95 via-white to-teal-50/40", ring: "ring-teal-200/70", accent: "border-l-teal-400" },
  { header: "from-indigo-50/95 via-white to-indigo-50/40", ring: "ring-indigo-200/70", accent: "border-l-indigo-400" },
  { header: "from-orange-50/95 via-white to-orange-50/40", ring: "ring-orange-200/70", accent: "border-l-orange-400" },
] as const;

function hasDistinctEnglish(nameGr: string, nameEn?: string): boolean {
  return Boolean(nameEn?.trim() && nameEn.trim().toLowerCase() !== nameGr.trim().toLowerCase());
}

export function MenuImportCategoryEditor({
  categories,
  copy,
  hideEmpty,
  showIssuesOnly,
  searchQuery,
  expandAllToken = 0,
  collapseAllToken = 0,
  onUpdateCategory,
  onUpdateItem,
}: {
  categories: ParsedMenuCategoryDraft[];
  hideEmpty: boolean;
  showIssuesOnly: boolean;
  searchQuery: string;
  expandAllToken?: number;
  collapseAllToken?: number;
  copy: {
    categoryLabel: string;
    categoryEnLabel: string;
    uncategorizedHint: string;
    emptyCategory: string;
    itemsCount: (selected: number, total: number) => string;
    noResults: string;
    itemNameLabel: string;
    itemNameEnLabel: string;
    addEnglish: string;
    priceLabel: string;
    issueBadge: string;
    includeCategory: string;
    includeItem: string;
  };
  onUpdateCategory: (catId: string, patch: Partial<ParsedMenuCategoryDraft>) => void;
  onUpdateItem: (catId: string, itemId: string, patch: Partial<ParsedMenuItemDraft>) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showEnFor, setShowEnFor] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (expandAllToken > 0) {
      setExpanded(Object.fromEntries(categories.map((c) => [c.id, true])));
    }
  }, [expandAllToken, categories]);

  useEffect(() => {
    if (collapseAllToken > 0) {
      setExpanded(Object.fromEntries(categories.map((c) => [c.id, false])));
    }
  }, [collapseAllToken, categories]);

  const searchLower = searchQuery.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    const q = searchLower;
    return categories.filter((cat) => {
      if (hideEmpty && cat.items.length === 0) return false;
      if (showIssuesOnly && !categoryHasIssues(cat)) return false;
      if (!q) return true;
      if (cat.nameGr.toLowerCase().includes(q)) return true;
      return cat.items.some(
        (i) =>
          i.nameGr.toLowerCase().includes(q) ||
          (i.nameEn?.toLowerCase().includes(q) ?? false),
      );
    });
  }, [categories, hideEmpty, showIssuesOnly, searchLower]);

  function isExpanded(catId: string) {
    return expanded[catId] === true;
  }

  function categoryMatchesSearch(cat: ParsedMenuCategoryDraft) {
    if (!searchLower) return false;
    if (cat.nameGr.toLowerCase().includes(searchLower)) return true;
    return cat.items.some(
      (i) =>
        i.nameGr.toLowerCase().includes(searchLower) ||
        (i.nameEn?.toLowerCase().includes(searchLower) ?? false),
    );
  }

  if (visibleCategories.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{copy.noResults}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {visibleCategories.map((cat, index) => {
        const open = isExpanded(cat.id) || categoryMatchesSearch(cat);
        const tint = CATEGORY_TINTS[index % CATEGORY_TINTS.length];
        const selectedInCat = cat.items.filter((i) => i.selected).length;
        const hasIssues = categoryHasIssues(cat);
        const isUncategorized = cat.nameGr === PDF_IMPORT_UNCATEGORIZED_CATEGORY;
        const showCategoryEn =
          hasDistinctEnglish(cat.nameGr, cat.nameEn) ||
          isLatinOnlyMenuText(cat.nameGr) ||
          Boolean(showEnFor[`cat-${cat.id}`]);

        const visibleItems = cat.items.filter((item) => {
          if (showIssuesOnly && !itemHasIssues(item) && !categoryHasIssues(cat)) return false;
          const q = searchLower;
          if (!q) return true;
          return (
            item.nameGr.toLowerCase().includes(q) ||
            (item.nameEn?.toLowerCase().includes(q) ?? false) ||
            cat.nameGr.toLowerCase().includes(q)
          );
        });

        return (
          <Card
            key={cat.id}
            className={cn(
              "overflow-hidden border-0 border-l-4 p-0 shadow-card ring-1",
              hasIssues ? "border-l-amber-400 ring-amber-200/70" : cn(tint.accent, tint.ring),
              !cat.selected && "opacity-55",
            )}
          >
            <div
              className={cn(
                "border-b border-white/60 bg-gradient-to-r px-5 py-4",
                hasIssues ? "from-amber-50/90 via-white to-amber-50/40" : tint.header,
              )}
            >
              <div className="flex flex-wrap items-start gap-3">
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={cat.selected}
                    onChange={(e) => onUpdateCategory(cat.id, { selected: e.target.checked })}
                    className="h-4 w-4 accent-brand-blue"
                  />
                  <span className="sr-only">{copy.includeCategory}</span>
                </label>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
                      {copy.categoryLabel}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <input
                        value={cat.nameGr}
                        onChange={(e) => onUpdateCategory(cat.id, { nameGr: e.target.value })}
                        placeholder={FORM_PLACEHOLDERS.importCategory}
                        className="min-w-[200px] flex-1 rounded-button border border-slate-200 bg-white px-3 py-2.5 text-base font-bold text-brand-navy shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [cat.id]: !isExpanded(cat.id) }))
                        }
                        className="inline-flex items-center gap-1 rounded-button border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 transition", open && "rotate-180")}
                        />
                        {copy.itemsCount(selectedInCat, cat.items.length)}
                      </button>
                    </div>
                  </div>

                  {showCategoryEn ? (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500">{copy.categoryEnLabel}</p>
                      <input
                        value={cat.nameEn ?? ""}
                        onChange={(e) =>
                          onUpdateCategory(cat.id, { nameEn: e.target.value || undefined })
                        }
                        className="mt-1 w-full max-w-md rounded-button border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  ) : isLatinOnlyMenuText(cat.nameGr) ? null : (
                    <button
                      type="button"
                      onClick={() => setShowEnFor((s) => ({ ...s, [`cat-${cat.id}`]: true }))}
                      className="text-xs font-medium text-brand-blue hover:underline"
                    >
                      {copy.addEnglish}
                    </button>
                  )}

                  {isUncategorized ? (
                    <p className="text-xs leading-relaxed text-slate-600">{copy.uncategorizedHint}</p>
                  ) : null}

                  {cat.warnings.map((w) => (
                    <p key={w} className="text-xs font-medium text-amber-800">
                      {w}
                    </p>
                  ))}
                </div>

                {hasIssues ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                    {copy.issueBadge}
                  </span>
                ) : null}
              </div>
            </div>

            {open && cat.items.length > 0 ? (
              <div className={cn("divide-y divide-slate-100/80", hasIssues ? "bg-amber-50/20" : "bg-white/70")}>
                {visibleItems.map((item) => {
                  const showItemEn =
                    hasDistinctEnglish(item.nameGr, item.nameEn) ||
                    isLatinOnlyMenuText(item.nameGr) ||
                    Boolean(showEnFor[`item-${item.id}`]);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "px-5 py-4",
                        itemHasIssues(item) && "bg-amber-50/30",
                      )}
                    >
                      <div className="grid grid-cols-[auto_minmax(0,1fr)_7.5rem] items-start gap-x-3 gap-y-1.5 sm:grid-cols-[auto_minmax(0,1fr)_8.5rem]">
                        <div className="row-start-2 flex h-10 items-center self-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={(e) =>
                                onUpdateItem(cat.id, item.id, { selected: e.target.checked })
                              }
                              className="h-4 w-4 accent-brand-blue"
                            />
                            <span className="sr-only">{copy.includeItem}</span>
                          </label>
                        </div>

                        <label className="col-start-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {copy.itemNameLabel}
                        </label>
                        <label className="col-start-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {copy.priceLabel}
                        </label>

                        <div className="col-start-2 row-start-2 min-w-0">
                          <input
                            value={item.nameGr}
                            onChange={(e) =>
                              onUpdateItem(cat.id, item.id, { nameGr: e.target.value })
                            }
                            placeholder={FORM_PLACEHOLDERS.importItemGr}
                            className="w-full rounded-button border border-slate-200 px-3 py-2.5 text-sm font-medium text-brand-navy"
                          />
                        </div>

                        <div className="col-start-3 row-start-2">
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                              €
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price ?? ""}
                              onChange={(e) =>
                                onUpdateItem(cat.id, item.id, {
                                  price: e.target.value ? Number.parseFloat(e.target.value) : null,
                                })
                              }
                              placeholder="0.00"
                              className={cn(
                                "w-full rounded-button border py-2.5 pl-8 pr-3 text-right text-base font-semibold tabular-nums",
                                item.price === null
                                  ? "border-amber-300 bg-amber-50/60 text-amber-950"
                                  : "border-slate-200 text-brand-navy",
                              )}
                            />
                          </div>
                        </div>

                        <div className="col-start-2 row-start-3 space-y-1.5">
                          {showItemEn ? (
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500">
                                {copy.itemNameEnLabel}
                              </label>
                              <input
                                value={item.nameEn ?? ""}
                                onChange={(e) =>
                                  onUpdateItem(cat.id, item.id, {
                                    nameEn: e.target.value || undefined,
                                  })
                                }
                                placeholder={FORM_PLACEHOLDERS.importItemEn}
                                className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                          ) : isLatinOnlyMenuText(item.nameGr) ? null : (
                            <button
                              type="button"
                              onClick={() =>
                                setShowEnFor((s) => ({ ...s, [`item-${item.id}`]: true }))
                              }
                              className="text-xs font-medium text-brand-blue hover:underline"
                            >
                              {copy.addEnglish}
                            </button>
                          )}

                          {item.warnings.length > 0 ? (
                            <p className="text-xs leading-relaxed text-amber-800">
                              {item.warnings.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {open && cat.items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">{copy.emptyCategory}</p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export function MenuImportEditorToolbar({
  copy,
  hideEmpty,
  showIssuesOnly,
  searchQuery,
  onHideEmptyChange,
  onShowIssuesOnlyChange,
  onSearchChange,
  onSelectAll,
  onDeselectAll,
  onExpandAll,
  onCollapseAll,
}: {
  hideEmpty: boolean;
  showIssuesOnly: boolean;
  searchQuery: string;
  copy: {
    toolbarTitle: string;
    toolbarHint: string;
    searchPlaceholder: string;
    hideEmpty: string;
    showIssuesOnly: string;
    selectAll: string;
    deselectAll: string;
    expandAll: string;
    collapseAll: string;
  };
  onHideEmptyChange: (v: boolean) => void;
  onShowIssuesOnlyChange: (v: boolean) => void;
  onSearchChange: (v: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <Card className="border-brand-blue/10">
      <p className="font-semibold text-brand-navy">{copy.toolbarTitle}</p>
      <p className="mt-1 text-sm text-slate-600">{copy.toolbarHint}</p>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full rounded-button border border-slate-200 py-2.5 pl-9 pr-3 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 rounded-button border border-slate-200 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => onHideEmptyChange(e.target.checked)}
              className="accent-brand-blue"
            />
            {copy.hideEmpty}
          </label>
          <label className="inline-flex items-center gap-2 rounded-button border border-slate-200 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={showIssuesOnly}
              onChange={(e) => onShowIssuesOnlyChange(e.target.checked)}
              className="accent-brand-blue"
            />
            {copy.showIssuesOnly}
          </label>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onSelectAll} className={buttonClass("secondary", "sm")}>
          {copy.selectAll}
        </button>
        <button type="button" onClick={onDeselectAll} className={buttonClass("secondary", "sm")}>
          {copy.deselectAll}
        </button>
        <button type="button" onClick={onExpandAll} className={buttonClass("secondary", "sm")}>
          {copy.expandAll}
        </button>
        <button type="button" onClick={onCollapseAll} className={buttonClass("secondary", "sm")}>
          {copy.collapseAll}
        </button>
      </div>
    </Card>
  );
}
