"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  Pencil,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { MenuPdfParseResult, ParsedMenuCategoryDraft, ParsedMenuItemDraft } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Venue = {
  id: string;
  name: string;
  menus: { id: string; name: string }[];
};

export function MenuImportWizard({
  venues,
  initialVenueId,
}: {
  venues: Venue[];
  initialVenueId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [menuId, setMenuId] = useState(venue?.menus[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState<MenuPdfParseResult | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const selectedCounts = useMemo(() => {
    if (!draft) return { categories: 0, items: 0 };
    const categories = draft.categories.filter((c) => c.selected).length;
    const items = draft.categories
      .filter((c) => c.selected)
      .flatMap((c) => c.items.filter((i) => i.selected)).length;
    return { categories, items };
  }, [draft]);

  function onVenueChange(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    setMenuId(v?.menus[0]?.id ?? "");
    setDraft(null);
    setStep(1);
  }

  function onFilesSelected(list: FileList | null) {
    if (!list) return;
    setFiles(Array.from(list));
    setDraft(null);
    setStep(1);
  }

  const parsePdfs = useCallback(async () => {
    if (!menuId || files.length === 0) {
      setFlash({ type: "error", text: "Επίλεξε κατάλογο και τουλάχιστον ένα PDF." });
      return;
    }
    setParsing(true);
    setFlash(null);
    try {
      const form = new FormData();
      form.set("menuId", menuId);
      for (const file of files) form.append("files", file);
      const res = await fetch("/api/menu-import/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        showFromResponse(data, false);
        return;
      }
      setDraft(data as MenuPdfParseResult);
      setStep(2);
      showFromResponse(data, true);
    } finally {
      setParsing(false);
    }
  }, [menuId, files, showFromResponse, setFlash]);

  function updateCategory(catId: string, patch: Partial<ParsedMenuCategoryDraft>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            categories: d.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)),
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
                ? {
                    ...c,
                    items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
                  }
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
      setFlash({ type: "error", text: "Επίλεξε τουλάχιστον ένα πιάτο." });
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
          Βήμα {step} από 2 — {step === 1 ? "Ανέβασμα PDF" : "Έλεγχος & εισαγωγή"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Ανέβασε ένα ή περισσότερα PDF καταλόγων. Μετά ελέγχεις/διορθώνεις κατηγορίες και τιμές πριν
          την αποθήκευση. Μετά μπορείς να αλλάξεις φωτο, τιμές και περιγραφές χειροκίνητα.
        </p>
      </Card>

      {step === 1 ? (
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
              Ιδανικά digital PDF (όχι σαρωμένη φωτο). Λειτουργεί και με PDF χωρίς τιμές (all-inclusive κ.λπ.) —
              συμπληρώνεις τιμές μετά. Κάθε PDF μπορεί να είναι ξεχωριστός κατάλογος.
            </p>
            <label
              className={`mt-4 flex cursor-pointer flex-col items-center rounded-card border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center hover:border-brand-blue/40`}
            >
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
                  <li key={f.name}>
                    {f.name} ({Math.round(f.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={parsePdfs}
              disabled={parsing || files.length === 0}
              className={`mt-4 inline-flex items-center gap-2 ${buttonClass("primary")}`}
            >
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {parsing ? "Ανάλυση PDF..." : "Ανάλυση & προεπισκόπηση"}
            </button>
          </Card>
        </>
      ) : null}

      {step === 2 && draft ? (
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
                  {selectedCounts.categories} κατηγορίες · {selectedCounts.items} πιάτα επιλεγμένα
                </p>
                <p className="text-xs text-slate-500">
                  Από {draft.stats.filesProcessed} PDF · {draft.stats.itemsWithPrice} τιμές ·{" "}
                  {draft.stats.itemsFound - draft.stats.itemsWithPrice} χωρίς τιμή (€0)
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className={buttonClass("secondary", "sm")}>
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
                      <th className="pb-2 pr-2">Πιάτο (GR)</th>
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
                            className="w-full min-w-[140px] rounded border border-slate-200 px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2 align-top">
                          <input
                            value={item.nameEn ?? ""}
                            onChange={(e) => updateItem(cat.id, item.id, { nameEn: e.target.value || undefined })}
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

          <Card className="border-emerald-200 bg-emerald-50/50">
            <div className="flex flex-wrap items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="flex-1 text-sm text-emerald-900">
                Μετά την εισαγωγή, άνοιξε τον κατάλογο για φωτογραφίες, διόρθωση τιμών και διαθεσιμότητα.
              </p>
              <button
                type="button"
                onClick={applyImport}
                disabled={importing || selectedCounts.items === 0}
                className={`inline-flex items-center gap-2 ${buttonClass("primary")}`}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                {importing ? "Εισαγωγή..." : `Εισαγωγή ${selectedCounts.items} πιάτων`}
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
