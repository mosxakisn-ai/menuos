"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileUp,
  ImageIcon,
  Pencil,
  Sparkles,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MenuPdfParseResult, ParsedMenuCategoryDraft, ParsedMenuItemDraft } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { CatalogPills } from "@/components/dashboard/catalog-pills";
import {
  MenuImportCategoryEditor,
  MenuImportEditorToolbar,
} from "@/components/dashboard/menu-import-category-editor";
import { MenuImportReviewReport } from "@/components/dashboard/menu-import-review-report";
import {
  ImportPipelineProgress,
  type PipelineStep,
} from "@/components/dashboard/import-pipeline-progress";
import { ImportProcessFlow } from "@/components/dashboard/import-process-flow";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { confirmDestructive } from "@/lib/confirm-action";
import {
  buildPageSelectionMap,
  loadAllPdfPagePreviews,
  pageSelectionStats,
  selectMenuPagesOnly,
  ensurePdfPagesAnalyzable,
  type PdfPagePreview,
} from "@/lib/pdf-page-preview";
import {
  buildMenuImportReviewReport,
  countSelectedImport,
  normalizeImportDraft,
  patchAllItems,
} from "@/lib/menu-import-review";
import { cn } from "@/lib/utils";
import {
  buildMenusPageUrl,
  buildMenusImportUrl,
  resolveMenuIdForVenue,
} from "@/lib/menus-nav-url";

type Venue = {
  id: string;
  name: string;
  menus: { id: string; name: string }[];
};

type Phase = "upload" | "processing" | "review";

function PageKindBadge({ kind }: { kind: PdfPagePreview["kind"] }) {
  const { d } = useDashboardCopy();
  const W = d.importWizard;
  const styles = {
    digital: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    scan: "bg-violet-50 text-violet-800 ring-violet-200",
    cover: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const icons = { digital: Type, scan: ImageIcon, cover: ImageIcon };
  const Icon = icons[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1",
        styles[kind],
      )}
    >
      <Icon className="h-3 w-3" />
      {W.pageKind[kind]}
    </span>
  );
}

function setStepStatus(steps: PipelineStep[], id: string, patch: Partial<PipelineStep>): PipelineStep[] {
  return steps.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export function MenuImportWizard({
  venues,
  initialVenueId,
}: {
  venues: Venue[];
  initialVenueId?: string;
}) {
  const { d, lang } = useDashboardCopy();
  const W = d.importWizard;
  const initialPipeline = useMemo<PipelineStep[]>(
    () => [
      { id: "scan", label: W.pipeline.scan, status: "pending" },
      { id: "extract", label: W.pipeline.extract, status: "pending" },
      { id: "parse", label: W.pipeline.parse, status: "pending" },
      { id: "done", label: W.pipeline.done, status: "pending" },
    ],
    [W],
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("upload");
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [menuId, setMenuId] = useState(() =>
    resolveMenuIdForVenue(searchParams.get("menu"), venue?.menus ?? []),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PdfPagePreview[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>(initialPipeline);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setPipeline((prev) =>
      prev.map((step) => ({
        ...step,
        label: initialPipeline.find((s) => s.id === step.id)?.label ?? step.label,
      })),
    );
  }, [initialPipeline]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [visionRetrying, setVisionRetrying] = useState(false);
  const [visionAvailable, setVisionAvailable] = useState(false);
  const [draft, setDraft] = useState<
    | (MenuPdfParseResult & {
        ocrPagesUsed?: number;
        extraction?: {
          path: "digital" | "ocr" | "hybrid";
          confidence: number;
          suggestsVision: boolean;
        };
      })
    | null
  >(null);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(true);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandAllToken, setExpandAllToken] = useState(0);
  const [collapseAllToken, setCollapseAllToken] = useState(0);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const pageStats = useMemo(() => pageSelectionStats(pages), [pages]);
  const activeMenu = venue?.menus.find((m) => m.id === menuId);

  const resetAll = useCallback(() => {
    setDraft(null);
    setPages([]);
    setPhase("upload");
    setPipeline(initialPipeline);
    setProgress(0);
    setAdvancedOpen(false);
    setHideEmptyCategories(true);
    setShowIssuesOnly(false);
    setSearchQuery("");
    setVisionRetrying(false);
  }, [initialPipeline]);

  useEffect(() => {
    const venueParam = searchParams.get("venue");
    if (!venueParam || venueParam === venueId) return;
    const v = venues.find((x) => x.id === venueParam);
    if (!v) return;
    setVenueId(venueParam);
    const nextMenuId = resolveMenuIdForVenue(searchParams.get("menu"), v.menus);
    setMenuId(nextMenuId);
    resetAll();
  }, [searchParams, venueId, venues, resetAll]);

  useEffect(() => {
    const menus = venue?.menus ?? [];
    if (menus.length === 0) return;
    const resolved = resolveMenuIdForVenue(searchParams.get("menu"), menus);
    setMenuId((prev) => (prev === resolved ? prev : resolved));
  }, [searchParams, venue?.menus]);

  function syncImportUrl(next: { venueId: string; menuId?: string }) {
    router.replace(buildMenusImportUrl(next), { scroll: false });
  }

  function selectMenu(nextMenuId: string) {
    if (nextMenuId === menuId) return;
    if (phase === "review" && draft) {
      const targetName = venue?.menus.find((m) => m.id === nextMenuId)?.name ?? "";
      if (!confirmDestructive(W.changeCatalogConfirm(targetName))) return;
    }
    setMenuId(nextMenuId);
  }

  useEffect(() => {
    if (!venueId || !menuId) return;
    const venueParam = searchParams.get("venue");
    const menuParam = searchParams.get("menu");
    if (venueParam === venueId && menuParam === menuId) return;
    syncImportUrl({ venueId, menuId });
  }, [venueId, menuId, searchParams]);

  const selectedCounts = useMemo(() => {
    if (!draft) return { categories: 0, items: 0 };
    return countSelectedImport(draft);
  }, [draft]);

  const reviewReport = useMemo(() => {
    if (!draft) return null;
    const R = W.report;
    return buildMenuImportReviewReport(
      draft,
      {
        issueNoItems: R.issueNoItems,
        issueNoItemsHint: R.issueNoItemsHint,
        issueNoPrice: R.issueNoPrice,
        issueNoPriceHint: R.issueNoPriceHint,
        issueEmptyCategories: R.issueEmptyCategories,
        issueEmptyCategoriesHint: R.issueEmptyCategoriesHint,
        issueDuplicateCategories: R.issueDuplicateCategories,
        issueItemWarnings: R.issueItemWarnings,
        issueItemWarningsHint: R.issueItemWarningsHint,
        issueNothingSelected: R.issueNothingSelected,
        issueNothingSelectedHint: R.issueNothingSelectedHint,
        issueOcr: R.issueOcr,
        issueOcrHint: R.issueOcrHint,
      },
      draft.ocrPagesUsed ?? 0,
    );
  }, [draft, W.report]);

  function onVenueChange(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    const nextMenuId = v?.menus[0]?.id ?? "";
    setMenuId(nextMenuId);
    syncImportUrl({ venueId: id, menuId: nextMenuId || undefined });
    resetAll();
  }

  function onFilesSelected(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list));
    resetAll();
  }

  function togglePage(id: string) {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  }

  const runAnalysis = useCallback(async (options?: { forceVision?: boolean }) => {
    if (!menuId || files.length === 0) {
      setFlash({ type: "error", text: W.selectCatalogAndPdf });
      return;
    }

    const forceVision = options?.forceVision ?? false;
    if (forceVision) {
      setVisionRetrying(true);
    } else {
      setPhase("processing");
      setFlash(null);
      setPipeline(initialPipeline.map((s) => ({ ...s, status: s.id === "scan" ? "active" : "pending" })));
      setProgress(5);
    }

    let loadedPages = pages;

    try {
      if (!forceVision && loadedPages.length === 0) {
        loadedPages = await loadAllPdfPagePreviews(
          files,
          (fileIndex, fileName, page, total) => {
          setPipeline((p) =>
            setStepStatus(p, "scan", {
              detail: W.loadingScanFile(fileName, page, total),
            }),
          );
          const fileWeight = 35 / files.length;
          setProgress(Math.min(35, 5 + fileIndex * fileWeight + (page / total) * fileWeight));
        },
          lang,
        );
        loadedPages = selectMenuPagesOnly(loadedPages);
        loadedPages = ensurePdfPagesAnalyzable(loadedPages);
        setPages(loadedPages);
      }

      if (!forceVision && !pageSelectionStats(loadedPages).canAnalyze) {
        setPipeline((p) =>
          p.map((s) => ({
            ...s,
            status: s.id === "scan" ? "error" : s.status,
            detail: s.id === "scan" ? W.noMenuPagesScanDetail : s.detail,
          })),
        );
        setPhase("upload");
        setAdvancedOpen(true);
        setFlash({
          type: "error",
          text: W.noMenuPages,
        });
        return;
      }

      setPipeline((p) =>
        p.map((s) => {
          if (s.id === "scan") return { ...s, status: "done", detail: undefined };
          if (s.id === "extract") return { ...s, status: "active", detail: forceVision ? W.visionRetrying : W.extractDetail };
          return s;
        }),
      );
      if (!forceVision) setProgress(40);

      const form = new FormData();
      form.set("menuId", menuId);
      form.set("pageSelections", JSON.stringify(buildPageSelectionMap(loadedPages)));
      if (forceVision) form.set("forceVision", "1");
      for (const file of files) form.append("files", file);

      const res = await fetch("/api/menu-import/parse", { method: "POST", body: form });
      const data = await res.json();

      if (typeof data.visionAvailable === "boolean") {
        setVisionAvailable(data.visionAvailable);
      }

      if (!res.ok) {
        if (forceVision) {
          showFromResponse(data, false, res.status);
          return;
        }
        setPipeline((p) =>
          p.map((s) => ({
            ...s,
            status: s.id === "extract" ? "error" : s.status === "done" ? "done" : "pending",
            detail: s.id === "extract" ? (data.error as string) : s.detail,
          })),
        );
        setPhase("upload");
        setAdvancedOpen(true);
        showFromResponse(data, false, res.status);
        return;
      }

      const ocrUsed = (data.ocrPagesUsed as number | undefined) ?? 0;

      if (forceVision) {
        setDraft(
          normalizeImportDraft(
            data as MenuPdfParseResult & {
              ocrPagesUsed?: number;
              extraction?: {
                path: "digital" | "ocr" | "hybrid" | "vision";
                confidence: number;
                suggestsVision: boolean;
                visionUsed?: boolean;
                visionPages?: number;
              };
            },
          ),
        );
        if (data.extraction?.visionUsed) {
          showFromResponse({ message: W.visionRetrySuccess }, true);
        } else {
          setFlash({ type: "info", text: W.visionRetryNoImprovement });
        }
        return;
      }

      setPipeline((p) =>
        p.map((s) => {
          if (s.id === "extract") {
            return {
              ...s,
              status: "done",
              detail: ocrUsed > 0 ? W.ocrUsed(ocrUsed) : undefined,
            };
          }
          if (s.id === "parse") return { ...s, status: "done" };
          if (s.id === "done") return { ...s, status: "done" };
          return s;
        }),
      );
      setProgress(100);

      await new Promise((r) => setTimeout(r, 400));

      setDraft(
        normalizeImportDraft(
          data as MenuPdfParseResult & {
            ocrPagesUsed?: number;
            extraction?: {
              path: "digital" | "ocr" | "hybrid";
              confidence: number;
              suggestsVision: boolean;
            };
          },
        ),
      );
      setPhase("review");
      showFromResponse(data, true);
    } catch (err) {
      console.error("import pipeline", err);
      if (options?.forceVision) {
        const detail = err instanceof Error && err.message.trim() ? err.message : W.parseFailed;
        setFlash({ type: "error", text: detail });
        return;
      }
      setPipeline((p) => p.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)));
      setPhase("upload");
      const detail = err instanceof Error && err.message.trim() ? err.message : W.parseFailed;
      setFlash({ type: "error", text: detail });
    } finally {
      if (options?.forceVision) setVisionRetrying(false);
    }
  }, [menuId, files, pages, showFromResponse, setFlash, initialPipeline, W, lang]);

  function updateCategory(catId: string, patch: Partial<ParsedMenuCategoryDraft>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            categories: d.categories.map((c) => {
              if (c.id !== catId) return c;
              const next = { ...c, ...patch };
              if (patch.selected === true) {
                next.items = c.items.map((i) => ({ ...i, selected: true }));
              }
              if (patch.selected === false) {
                next.items = c.items.map((i) => ({ ...i, selected: false }));
              }
              return next;
            }),
          }
        : d,
    );
  }

  function updateItem(catId: string, itemId: string, patch: Partial<ParsedMenuItemDraft>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            categories: d.categories.map((c) =>
              c.id === catId
                ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
                : c,
            ),
          }
        : d,
    );
  }

  function setAllItemsSelected(selected: boolean) {
    setDraft((d) => (d ? patchAllItems(d, { selected }) : d));
  }

  async function applyImport() {
    if (!draft || !menuId) return;

    const categories = draft.categories
      .filter((c) => c.selected)
      .map((c) => ({
        nameGr: c.nameGr,
        nameEn: c.nameEn,
        selected: c.selected,
        items: c.items
          .filter((i) => i.selected)
          .map((i) => ({
            nameGr: i.nameGr,
            nameEn: i.nameEn,
            price: i.price ?? 0,
            descriptionGr: i.descriptionGr,
            selected: true,
          })),
      }))
      .filter((c) => c.items.length > 0);

    if (categories.length === 0) {
      setFlash({ type: "error", text: W.selectMinOneItem(d.catalogEntry.one) });
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/menu-import/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, categories }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setTimeout(() => {
          router.push(buildMenusPageUrl({ venueId, menuId }));
          router.refresh();
        }, 1200);
      }
    } finally {
      setImporting(false);
    }
  }

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">{W.needVenueTitle}</p>
        <Link href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {d.addVenue}
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <Card className="overflow-hidden border-brand-blue/20 bg-gradient-to-br from-brand-blue/[0.07] via-white to-cyan-50/40 p-0">
        <div className="border-b border-brand-blue/10 bg-white/50 px-5 py-4 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue">{W.badge}</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-brand-navy">
            {phase === "upload" && W.phaseUpload}
            {phase === "processing" && W.processingTitle}
            {phase === "review" && W.phaseReview}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">{W.hint}</p>
        </div>
        {phase === "upload" ? (
          <div className="px-4 py-4 sm:px-5">
            <ImportProcessFlow labels={W.processFlow} />
          </div>
        ) : null}
      </Card>

      {phase === "processing" ? (
        <Card className="overflow-hidden border-brand-blue/15 py-4">
          <ImportPipelineProgress steps={pipeline} progress={progress} title={W.processingTitle} />
        </Card>
      ) : null}

      {phase === "upload" ? (
        <>
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-brand-navy">{d.venue}</span>
                <select
                  value={venueId}
                  onChange={(e) => onVenueChange(e.target.value)}
                  className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Link
                  href={buildMenusPageUrl({ venueId, menuId })}
                  className={`inline-flex h-10 w-full items-center justify-center ${buttonClass("secondary", "md")}`}
                >
                  {d.pages.import.backToCatalog}
                </Link>
              </div>
            </div>

            {venue && venue.menus.length > 0 ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="font-semibold text-brand-navy">{W.activeCatalogTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{W.activeCatalogHint}</p>
                <CatalogPills
                  menus={venue.menus}
                  activeMenuId={menuId}
                  onSelect={selectMenu}
                  className="mt-3"
                />
                {activeMenu ? (
                  <p className="mt-2 text-sm font-semibold text-brand-blue">{activeMenu.name}</p>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card>
            <h3 className="font-semibold text-brand-navy">{W.pdfFilesTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{W.pdfFilesHint}</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center rounded-card border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center transition hover:border-brand-blue/40 hover:bg-brand-blue/[0.02]">
              <FileUp className="h-10 w-10 text-brand-blue" />
              <span className="mt-3 font-medium text-brand-navy">{W.dropzoneTitle}</span>
              <span className="mt-1 text-xs text-slate-500">{W.dropzoneHint}</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="sr-only"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </label>
            {files.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm text-slate-600">
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`}>
                    {f.name} ({Math.round(f.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => void runAnalysis()}
              disabled={files.length === 0 || !menuId}
              className={`mt-4 inline-flex items-center gap-2 ${buttonClass("primary")}`}
            >
              <Sparkles className="h-4 w-4" />
              {W.analyzeButton}
            </button>
          </Card>

          {files.length > 0 ? (
            <Card className="overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="font-semibold text-brand-navy">{W.advancedTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{W.advancedHint}</p>
                </div>
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0 text-slate-400 transition", advancedOpen && "rotate-180")}
                />
              </button>

              {advancedOpen ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  {pages.length === 0 ? (
                    <p className="text-sm text-slate-500">{W.previewPagesFirst(W.analyzeButton)}</p>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-600">
                          {W.pageStats(
                            pageStats.selectedCount,
                            pageStats.digitalCount,
                            pageStats.scanSelectedCount,
                            pageStats.coverTotalCount,
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setPages(selectMenuPagesOnly(pages))}
                            className={buttonClass("secondary", "sm")}
                          >
                            {W.selectMenuPages}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPages((p) => p.map((x) => ({ ...x, selected: false })))}
                            className={buttonClass("secondary", "sm")}
                          >
                            {W.deselectAll}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {pages.map((p) => (
                          <label
                            key={p.id}
                            className={cn(
                              "cursor-pointer overflow-hidden rounded-card border-2 bg-white shadow-card transition",
                              p.selected ? "border-brand-blue ring-2 ring-brand-blue/20" : "border-slate-100 opacity-70",
                            )}
                          >
                            <div className="relative aspect-[3/4] bg-slate-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.thumbnailUrl}
                                alt={W.pageAlt(p.pageNumber)}
                                className="h-full w-full object-contain"
                              />
                              <input
                                type="checkbox"
                                checked={p.selected}
                                onChange={() => togglePage(p.id)}
                                className="absolute left-2 top-2 h-4 w-4 accent-brand-blue"
                              />
                            </div>
                            <div className="space-y-1 p-2">
                              <p className="text-[10px] text-slate-500">
                                {W.pageNumber(p.pageNumber, p.totalPages)}
                              </p>
                              <PageKindBadge kind={p.kind} />
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runAnalysis()}
                        disabled={!pageStats.canAnalyze}
                        className={`mt-4 inline-flex items-center gap-2 ${buttonClass("secondary")}`}
                      >
                        <Sparkles className="h-4 w-4" />
                        {W.reanalyze}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </Card>
          ) : null}
        </>
      ) : null}

      {phase === "review" && draft && reviewReport ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={resetAll} className={buttonClass("secondary", "sm")}>
              <ArrowLeft className="mr-1 inline h-4 w-4" />
              {W.newAnalysis}
            </button>
          </div>

          {venue && venue.menus.length > 0 ? (
            <Card className="border-brand-blue/20 bg-brand-blue/[0.03]">
              <p className="font-semibold text-brand-navy">{W.activeCatalogTitle}</p>
              <p className="mt-1 text-xs text-slate-500">{W.activeCatalogHint}</p>
              <CatalogPills
                menus={venue.menus}
                activeMenuId={menuId}
                onSelect={selectMenu}
                className="mt-3"
              />
              {activeMenu ? (
                <p className="mt-2 text-sm font-semibold text-brand-blue">
                  {W.importTargetConfirm(activeMenu.name)}
                </p>
              ) : null}
            </Card>
          ) : null}

          <MenuImportReviewReport
            report={reviewReport}
            ocrPagesUsed={draft.ocrPagesUsed}
            extraction={draft.extraction}
            visionAvailable={visionAvailable}
            visionRetrying={visionRetrying}
            onVisionRetry={() => void runAnalysis({ forceVision: true })}
            copy={{
              reportTitle: W.report.title,
              reportSubtitle: W.report.subtitle,
              statCategories: W.report.statCategories,
              statCategoriesSub: W.report.statCategoriesSub,
              statItems: W.report.statItems,
              statItemsSub: W.report.statItemsSub,
              statPrices: W.report.statPrices,
              statPricesSub: W.report.statPricesSub,
              statReady: W.report.statReady,
              statReadyYes: W.report.statReadyYes,
              statReadyNo: W.report.statReadyNo,
              issuesTitle: W.report.issuesTitle,
              issuesNone: W.report.issuesNone,
              ocrBadge: W.report.ocrBadge,
              extractionPath: W.report.extractionPath,
              visionUsedBadge: W.report.visionUsedBadge,
              visionHint: W.report.visionHint,
              visionHintUnavailable: W.report.visionHintUnavailable,
              visionRetryButton: W.report.visionRetryButton,
              visionRetrying: W.report.visionRetrying,
              nextStepsTitle: W.report.nextStepsTitle,
              nextSteps: W.report.nextSteps,
            }}
          />

          <MenuImportEditorToolbar
            hideEmpty={hideEmptyCategories}
            showIssuesOnly={showIssuesOnly}
            searchQuery={searchQuery}
            onHideEmptyChange={setHideEmptyCategories}
            onShowIssuesOnlyChange={setShowIssuesOnly}
            onSearchChange={setSearchQuery}
            onSelectAll={() => setAllItemsSelected(true)}
            onDeselectAll={() => setAllItemsSelected(false)}
            onExpandAll={() => setExpandAllToken((t) => t + 1)}
            onCollapseAll={() => setCollapseAllToken((t) => t + 1)}
            copy={{
              toolbarTitle: W.editor.toolbarTitle,
              toolbarHint: W.editor.toolbarHint,
              searchPlaceholder: W.editor.searchPlaceholder,
              hideEmpty: W.editor.hideEmpty,
              showIssuesOnly: W.editor.showIssuesOnly,
              selectAll: W.editor.selectAll,
              deselectAll: W.editor.deselectAll,
              expandAll: W.editor.expandAll,
              collapseAll: W.editor.collapseAll,
            }}
          />

          <MenuImportCategoryEditor
            categories={draft.categories}
            hideEmpty={hideEmptyCategories}
            showIssuesOnly={showIssuesOnly}
            searchQuery={searchQuery}
            expandAllToken={expandAllToken}
            collapseAllToken={collapseAllToken}
            onUpdateCategory={updateCategory}
            onUpdateItem={updateItem}
            copy={{
              categoryLabel: W.editor.categoryLabel,
              categoryEnLabel: W.editor.categoryEnLabel,
              uncategorizedHint: W.editor.uncategorizedHint,
              emptyCategory: W.editor.emptyCategory,
              itemsCount: W.editor.itemsCount,
              noResults: W.editor.noResults,
              itemNameLabel: W.editor.itemNameLabel,
              itemNameEnLabel: W.editor.itemNameEnLabel,
              addEnglish: W.editor.addEnglish,
              priceLabel: W.editor.priceLabel,
              issueBadge: W.editor.issueBadge,
              includeCategory: W.editor.includeCategory,
              includeItem: W.editor.includeItem,
            }}
          />

          <Card className="sticky bottom-4 z-20 overflow-hidden border-emerald-200 bg-white/95 shadow-lg backdrop-blur-sm">
            {importing ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <LoadingState variant="import" size="md" title={W.loadingImport} />
              </div>
            ) : null}
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy">{W.importConfirmTitle}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {W.importConfirmHint(
                    selectedCounts.categories,
                    d.catalogEntry.count(selectedCounts.items),
                  )}
                </p>
                {!reviewReport.canImport ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {W.report.issueNothingSelectedHint}
                  </p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {W.afterImportHint}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={applyImport}
                disabled={importing || !reviewReport.canImport}
                className={`inline-flex shrink-0 items-center gap-2 ${buttonClass("primary")}`}
              >
                <Pencil className="h-4 w-4" />
                {importing
                  ? W.loadingImport
                  : W.importButton(d.catalogEntry.count(selectedCounts.items))}
              </button>
            </div>
          </Card>
        </>
      ) : null}

      <p className="text-center text-sm text-slate-500">
        <Link href={buildMenusPageUrl({ venueId, menuId })} className="text-brand-blue hover:underline">
          {W.manualEditLink}
        </Link>
      </p>
    </div>
  );
}
