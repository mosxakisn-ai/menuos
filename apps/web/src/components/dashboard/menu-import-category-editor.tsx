"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { PDF_IMPORT_UNCATEGORIZED_CATEGORY, type ParsedMenuCategoryDraft, type ParsedMenuItemDraft } from "@menuos/shared";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { categoryHasIssues, itemHasIssues } from "@/lib/menu-import-review";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    if (expandAllToken > 0) setExpanded({});
  }, [expandAllToken]);

  useEffect(() => {
    if (collapseAllToken > 0) {
      setExpanded(Object.fromEntries(categories.map((c) => [c.id, false])));
    }
  }, [collapseAllToken, categories]);

  const visibleCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
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
  }, [categories, hideEmpty, showIssuesOnly, searchQuery]);

  function isExpanded(catId: string) {
    return expanded[catId] !== false;
  }

  if (visibleCategories.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">{copy.noResults}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {visibleCategories.map((cat) => {
        const open = isExpanded(cat.id);
        const selectedInCat = cat.items.filter((i) => i.selected).length;
        const hasIssues = categoryHasIssues(cat);
        const isUncategorized = cat.nameGr === PDF_IMPORT_UNCATEGORIZED_CATEGORY;
        const showCategoryEn =
          hasDistinctEnglish(cat.nameGr, cat.nameEn) || Boolean(showEnFor[`cat-${cat.id}`]);

        const visibleItems = cat.items.filter((item) => {
          if (showIssuesOnly && !itemHasIssues(item) && !categoryHasIssues(cat)) return false;
          const q = searchQuery.trim().toLowerCase();
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
              "overflow-hidden border-0 p-0 shadow-card ring-1 ring-slate-200/80",
              !cat.selected && "opacity-55",
            )}
          >
            <div
              className={cn(
                "border-b border-white/60 bg-gradient-to-r from-brand-blue/[0.08] via-white to-cyan-50/80 px-5 py-4",
                hasIssues && "from-amber-50/90 via-white to-amber-50/40",
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
                  ) : (
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
              <div className="divide-y divide-slate-100 bg-white">
                {visibleItems.map((item) => {
                  const showItemEn =
                    hasDistinctEnglish(item.nameGr, item.nameEn) ||
                    Boolean(showEnFor[`item-${item.id}`]);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_140px]",
                        itemHasIssues(item) && "bg-amber-50/30",
                      )}
                    >
                      <div className="flex gap-3">
                        <label className="mt-8 shrink-0">
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

                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {copy.itemNameLabel}
                            </label>
                            <input
                              value={item.nameGr}
                              onChange={(e) =>
                                onUpdateItem(cat.id, item.id, { nameGr: e.target.value })
                              }
                              placeholder={FORM_PLACEHOLDERS.importItemGr}
                              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5 text-sm font-medium text-brand-navy"
                            />
                          </div>

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
                          ) : (
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
                            <p className="text-xs text-amber-800">{item.warnings.join(" · ")}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="lg:pt-6">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {copy.priceLabel}
                        </label>
                        <div className="relative mt-1">
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
