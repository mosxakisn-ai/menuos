"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useCallback, useMemo, useState } from "react";
import type { MenuPdfParseResult, ParsedMenuCategoryDraft, ParsedMenuItemDraft } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  ImportPipelineProgress,
  type PipelineStep,
} from "@/components/dashboard/import-pipeline-progress";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import {
  buildPageSelectionMap,
  loadAllPdfPagePreviews,
  pageSelectionStats,
  selectMenuPagesOnly,
  type PdfPagePreview,
} from "@/lib/pdf-page-preview";
import { cn } from "@/lib/utils";

type Venue = {
  id: string;
  name: string;
  menus: { id: string; name: string }[];
};

type Phase = "upload" | "processing" | "review";

const W = DASHBOARD_EL.importWizard;

const INITIAL_PIPELINE: PipelineStep[] = [
  { id: "scan", label: W.pipeline.scan, status: "pending" },
  { id: "extract", label: W.pipeline.extract, status: "pending" },
  { id: "parse", label: W.pipeline.parse, status: "pending" },
  { id: "done", label: W.pipeline.done, status: "pending" },
];

function PageKindBadge({ kind }: { kind: PdfPagePreview["kind"] }) {
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
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [menuId, setMenuId] = useState(venue?.menus[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState<PdfPagePreview[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStep[]>(INITIAL_PIPELINE);
  const [progress, setProgress] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState<(MenuPdfParseResult & { ocrPagesUsed?: number }) | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const pageStats = useMemo(() => pageSelectionStats(pages), [pages]);

  const selectedCounts = useMemo(() => {
    if (!draft) return { categories: 0, items: 0 };
    const categories = draft.categories.filter((c) => c.selected).length;
    const items = draft.categories
      .filter((c) => c.selected)
      .flatMap((c) => c.items.filter((i) => i.selected)).length;
    return { categories, items };
  }, [draft]);

  function resetAll() {
    setDraft(null);
    setPages([]);
    setPhase("upload");
    setPipeline(INITIAL_PIPELINE);
    setProgress(0);
    setAdvancedOpen(false);
  }

  function onVenueChange(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    setMenuId(v?.menus[0]?.id ?? "");
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

  const runAnalysis = useCallback(async () => {
    if (!menuId || files.length === 0) {
      setFlash({ type: "error", text: "Επίλεξε κατάλογο και τουλάχιστον ένα PDF." });
      return;
    }

    setPhase("processing");
    setFlash(null);
    setPipeline(INITIAL_PIPELINE.map((s) => ({ ...s, status: s.id === "scan" ? "active" : "pending" })));
    setProgress(5);

    let loadedPages = pages;

    try {
      if (loadedPages.length === 0) {
        loadedPages = await loadAllPdfPagePreviews(files, (fileIndex, fileName, page, total) => {
          setPipeline((p) =>
            setStepStatus(p, "scan", {
              detail: W.loadingScanFile(fileName, page, total),
            }),
          );
          const fileWeight = 35 / files.length;
          setProgress(Math.min(35, 5 + fileIndex * fileWeight + (page / total) * fileWeight));
        });
        loadedPages = selectMenuPagesOnly(loadedPages);
        setPages(loadedPages);
      }

      if (!pageSelectionStats(loadedPages).canAnalyze) {
        setPipeline((p) =>
          p.map((s) => ({
            ...s,
            status: s.id === "scan" ? "error" : s.status,
            detail: s.id === "scan" ? "Δεν βρέθηκαν σελίδες μενού" : s.detail,
          })),
        );
        setPhase("upload");
        setAdvancedOpen(true);
        setFlash({
          type: "error",
          text: "Δεν βρέθηκαν σελίδες μενού. Άνοιξε «Προχωρημένα» και επίλεξε σελίδες χειροκίνητα.",
        });
        return;
      }

      setPipeline((p) =>
        p.map((s) => {
          if (s.id === "scan") return { ...s, status: "done", detail: undefined };
          if (s.id === "extract") return { ...s, status: "active", detail: "Digital + OCR..." };
          return s;
        }),
      );
      setProgress(40);

      const form = new FormData();
      form.set("menuId", menuId);
      form.set("pageSelections", JSON.stringify(buildPageSelectionMap(loadedPages)));
      for (const file of files) form.append("files", file);

      const res = await fetch("/api/menu-import/parse", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setPipeline((p) =>
          p.map((s) => ({
            ...s,
            status: s.id === "extract" ? "error" : s.status === "done" ? "done" : "pending",
            detail: s.id === "extract" ? (data.error as string) : s.detail,
          })),
        );
        setPhase("upload");
        setAdvancedOpen(true);
        showFromResponse(data, false);
        return;
      }

      const ocrUsed = (data.ocrPagesUsed as number | undefined) ?? 0;

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

      setDraft(data as MenuPdfParseResult & { ocrPagesUsed?: number });
      setPhase("review");
      showFromResponse(data, true);
    } catch (err) {
      console.error("import pipeline", err);
      setPipeline((p) => p.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)));
      setPhase("upload");
      setFlash({ type: "error", text: "Αποτυχία ανάλυσης. Δοκίμασε ξανά ή μικρότερο PDF." });
    }
  }, [menuId, files, pages, showFromResponse, setFlash]);

  function updateCategory(catId: string, patch: Partial<ParsedMenuCategoryDraft>) {
    setDraft((d) =>
      d ? { ...d, categories: d.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) } : d,
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
      setFlash({ type: "error", text: `Επίλεξε τουλάχιστον ένα ${DASHBOARD_EL.catalogEntry.one}.` });
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
          router.push(`/dashboard/menus?venue=${venueId}`);
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
        <p className="font-semibold text-brand-navy">Χρειάζεσαι κατάστημα πρώτα</p>
        <Link href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          Προσθήκη καταστήματος
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <Card className="border-brand-blue/20 bg-brand-blue/5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Import από PDF</p>
        <h2 className="mt-1 text-lg font-bold text-brand-navy">
          {phase === "upload" && "Ανέβασμα PDF"}
          {phase === "processing" && W.processingTitle}
          {phase === "review" && "Έλεγχος & εισαγωγή"}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{W.hint}</p>
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
                <span className="font-medium text-brand-navy">Κατάστημα</span>
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
              <label className="block text-sm">
                <span className="font-medium text-brand-navy">Κατάλογος</span>
                <select
                  value={menuId}
                  onChange={(e) => setMenuId(e.target.value)}
                  className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
                >
                  {(venue?.menus ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-brand-navy">PDF αρχεία (έως 10)</h3>
            <p className="mt-1 text-sm text-slate-600">
              Digital PDF και σαρωμένες εικόνες (OCR). Cover/logo παραλείπονται αυτόματα.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center rounded-card border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center transition hover:border-brand-blue/40 hover:bg-brand-blue/[0.02]">
              <FileUp className="h-10 w-10 text-brand-blue" />
              <span className="mt-3 font-medium text-brand-navy">Επίλεξε ή σύρε PDF εδώ</span>
              <span className="mt-1 text-xs text-slate-500">Max 10MB ανά αρχείο</span>
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
              onClick={runAnalysis}
              disabled={files.length === 0}
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
                    <p className="text-sm text-slate-500">
                      Πάτα «{W.analyzeButton}» πρώτα για preview σελίδων — ή ξανατρέξε ανάλυση.
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-600">
                          {pageStats.selectedCount} επιλεγμένες · {pageStats.digitalCount} digital ·{" "}
                          {pageStats.scanSelectedCount} OCR · {pageStats.coverTotalCount} cover
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
                                alt={`Σελίδα ${p.pageNumber}`}
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
                                Σελ. {p.pageNumber}/{p.totalPages}
                              </p>
                              <PageKindBadge kind={p.kind} />
                            </div>
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={runAnalysis}
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

      {phase === "review" && draft ? (
        <>
          {draft.warnings.length > 0 ? (
            <div className="space-y-2">
              {draft.warnings.map((w) => (
                <div
                  key={w}
                  role="alert"
                  className="flex items-start gap-2 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {w}
                </div>
              ))}
            </div>
          ) : null}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-navy">
                  {selectedCounts.categories} κατηγορίες ·{" "}
                  {DASHBOARD_EL.catalogEntry.count(selectedCounts.items)} επιλεγμένα
                </p>
                <p className="text-xs text-slate-500">
                  Από {draft.stats.filesProcessed} PDF · {draft.stats.itemsWithPrice} τιμές ·{" "}
                  {draft.stats.itemsFound - draft.stats.itemsWithPrice} χωρίς τιμή
                  {(draft.ocrPagesUsed ?? 0) > 0 ? ` · ${W.ocrUsed(draft.ocrPagesUsed!)}` : ""}
                </p>
              </div>
              <button type="button" onClick={resetAll} className={buttonClass("secondary", "sm")}>
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Νέα ανάλυση
              </button>
            </div>
          </Card>

          {draft.categories.map((cat) => (
            <Card key={cat.id}>
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  checked={cat.selected}
                  onChange={(e) => updateCategory(cat.id, { selected: e.target.checked })}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={cat.nameGr}
                      onChange={(e) => updateCategory(cat.id, { nameGr: e.target.value })}
                      placeholder={FORM_PLACEHOLDERS.importCategory}
                      className="rounded-button border border-slate-200 px-2 py-1 text-sm font-bold"
                    />
                    {cat.sourceFile ? (
                      <span className="text-xs text-slate-400">{cat.sourceFile}</span>
                    ) : null}
                  </div>
                  {cat.warnings.map((w) => (
                    <p key={w} className="mt-1 text-xs text-amber-700">
                      {w}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-2">✓</th>
                      <th className="pb-2 pr-2">Είδος (GR)</th>
                      <th className="pb-2 pr-2">EN</th>
                      <th className="pb-2 pr-2">Τιμή €</th>
                      <th className="pb-2">Σημειώσεις</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-2 pr-2 align-top">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateItem(cat.id, item.id, { selected: e.target.checked })}
                          />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            value={item.nameGr}
                            onChange={(e) => updateItem(cat.id, item.id, { nameGr: e.target.value })}
                            placeholder={FORM_PLACEHOLDERS.importItemGr}
                            className="w-full min-w-[140px] rounded border border-slate-200 px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            value={item.nameEn ?? ""}
                            onChange={(e) => updateItem(cat.id, item.id, { nameEn: e.target.value || undefined })}
                            placeholder={FORM_PLACEHOLDERS.importItemEn}
                            className="w-full min-w-[120px] rounded border border-slate-200 px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price ?? ""}
                            onChange={(e) =>
                              updateItem(cat.id, item.id, {
                                price: e.target.value ? Number.parseFloat(e.target.value) : null,
                              })
                            }
                            placeholder={FORM_PLACEHOLDERS.importItemPrice}
                            className="w-24 rounded border border-slate-200 px-2 py-1"
                          />
                        </td>
                        <td className="py-2 align-top text-xs text-amber-700">
                          {item.warnings.join(" ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          <Card className="relative overflow-hidden border-emerald-200 bg-emerald-50/50">
            {importing ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <LoadingState variant="import" size="md" title={W.loadingImport} />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="flex-1 text-sm text-emerald-900">
                Μετά την εισαγωγή, άνοιξε τον κατάλογο για φωτο, τιμές και διαθεσιμότητα.
              </p>
              <button
                type="button"
                onClick={applyImport}
                disabled={importing || selectedCounts.items === 0}
                className={`inline-flex items-center gap-2 ${buttonClass("primary")}`}
              >
                <Pencil className="h-4 w-4" />
                {importing
                  ? W.loadingImport
                  : `Εισαγωγή ${DASHBOARD_EL.catalogEntry.count(selectedCounts.items)}`}
              </button>
            </div>
          </Card>
        </>
      ) : null}

      <p className="text-center text-sm text-slate-500">
        <Link href={`/dashboard/menus?venue=${venueId}`} className="text-brand-blue hover:underline">
          ← Χειροκίνητη επεξεργασία καταλόγου
        </Link>
      </p>
    </div>
  );
}
