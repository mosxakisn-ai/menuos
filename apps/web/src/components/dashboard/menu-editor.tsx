"use client";

import { ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ITEM_LABEL_OPTIONS, ITEM_LABEL_STYLES, isItemLabel, newItemExtraId, parseItemExtras, type ItemExtra, type ItemLabel } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardInputClass,
  dashboardLabelClass,
  DashboardToolbar,
} from "@/components/dashboard/dashboard-page";
import { PhotoUploadField } from "@/components/dashboard/photo-upload-field";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DASHBOARD_EL } from "@/content/dashboard-el";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";
import { cn } from "@/lib/utils";

type Translation = { language: string; name: string; description?: string | null };
type Item = {
  id: string;
  price: { toString(): string };
  available: boolean;
  label: string | null;
  photoUrl: string | null;
  extras?: unknown;
  translations: Translation[];
};
type Category = {
  id: string;
  translations: Translation[];
  items: Item[];
};
type Menu = { id: string; name: string; categories: Category[] };
type Venue = { id: string; name: string; slug: string };

function parseMenuPrice(raw: string): number {
  return parseFloat(raw.trim().replace(",", "."));
}

export function MenuEditor({
  venues,
  initialVenueId,
  welcome,
  canImportPdf = false,
}: {
  venues: Venue[];
  initialVenueId?: string;
  welcome?: boolean;
  canImportPdf?: boolean;
}) {
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  useEffect(() => {
    if (welcome) {
      setFlash({
        type: "info",
        text: DASHBOARD_EL.venueCreated,
      });
    }
  }, [welcome, setFlash]);

  const [catNameGr, setCatNameGr] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  const [itemCategoryId, setItemCategoryId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    nameGr: "",
    price: "",
    descriptionGr: "",
    label: "" as "" | ItemLabel,
    photoUrl: "",
  });
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryNameGr, setEditCategoryNameGr] = useState("");
  const [editNameGr, setEditNameGr] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editExtras, setEditExtras] = useState<ItemExtra[]>([]);
  const [savingName, setSavingName] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [newMenuName, setNewMenuName] = useState("");
  const [addingMenu, setAddingMenu] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);

  const loadMenus = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menus?venueId=${venueId}`);
      const data = await res.json();
      if (res.ok) {
        setMenus(data.menus ?? []);
        setVenue(data.venue ?? null);
        setActiveMenuId((prev) => {
          const list = data.menus ?? [];
          if (prev && list.some((m: Menu) => m.id === prev)) return prev;
          return list[0]?.id ?? "";
        });
      } else {
        showFromResponse(data, false);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId, showFromResponse]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const menuId = activeMenuId || menus[0]?.id;
    if (!menuId || !catNameGr.trim()) return;
    setAddingCat(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId,
          nameGr: catNameGr.trim(),
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setCatNameGr("");
        await loadMenus();
      }
    } finally {
      setAddingCat(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemCategoryId || !itemForm.nameGr.trim() || !itemForm.price) return;
    const price = parseMenuPrice(itemForm.price);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: "Βάλε έγκυρη τιμή (π.χ. 4.50)." });
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: itemCategoryId,
          nameGr: itemForm.nameGr.trim(),
          price,
          descriptionGr: itemForm.descriptionGr.trim() || undefined,
          label: itemForm.label || undefined,
          photoUrl: itemForm.photoUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setItemForm({ nameGr: "", price: "", descriptionGr: "", label: "", photoUrl: "" });
        setItemCategoryId(null);
        await loadMenus();
      }
    } finally {
      setAddingItem(false);
    }
  }

  async function addMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !newMenuName.trim()) return;
    setAddingMenu(true);
    try {
      const res = await fetch("/api/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, name: newMenuName.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setNewMenuName("");
        await loadMenus();
        if (data.menu?.id) setActiveMenuId(data.menu.id);
      }
    } finally {
      setAddingMenu(false);
    }
  }

  function menuHasData(menu: Menu) {
    return menu.categories.length > 0;
  }

  function canDeleteMenu(menu: Menu) {
    return menus.length > 1 && !menuHasData(menu);
  }

  async function deleteMenu(menu: Menu) {
    if (menuHasData(menu)) {
      setFlash({ type: "error", text: DASHBOARD_EL.deleteCatalogHasData });
      return;
    }
    if (menus.length <= 1) {
      setFlash({ type: "error", text: DASHBOARD_EL.deleteCatalogLast });
      return;
    }
    if (!window.confirm(DASHBOARD_EL.deleteCatalogConfirm(menu.name))) return;

    setDeletingMenuId(menu.id);
    try {
      const res = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        if (activeMenuId === menu.id) {
          const next = menus.find((m) => m.id !== menu.id);
          setActiveMenuId(next?.id ?? "");
        }
        await loadMenus();
      }
    } finally {
      setDeletingMenuId(null);
    }
  }

  async function setItemLabel(itemId: string, label: ItemLabel | null) {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function saveItemEdit(itemId: string) {
    if (!editNameGr.trim()) return;
    const price = parseMenuPrice(editPrice);
    if (!Number.isFinite(price) || price < 0) {
      setFlash({ type: "error", text: "Βάλε έγκυρη τιμή (π.χ. 4.50)." });
      return;
    }
    const extras = editExtras
      .map((e) => ({ ...e, labels: { ...e.labels, GR: e.labels.GR.trim() } }))
      .filter((e) => e.labels.GR)
      .map((e) => {
        const out: ItemExtra = { id: e.id, labels: e.labels };
        if (e.price != null && Number.isFinite(e.price) && e.price > 0) {
          out.price = Math.round(e.price * 100) / 100;
        }
        return out;
      });
    setSavingName(true);
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameGr: editNameGr.trim(),
          price,
          photoUrl: editPhotoUrl.trim() || "",
          extras,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setEditingItemId(null);
        await loadMenus();
      }
    } finally {
      setSavingName(false);
    }
  }

  async function toggleItem(item: Item) {
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function deleteItem(id: string) {
    if (!window.confirm(DASHBOARD_EL.catalogEntry.deleteConfirm)) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  async function deleteCategory(cat: Category) {
    if (cat.items.length > 0) {
      setFlash({
        type: "error",
        text: DASHBOARD_EL.catalogEntry.categoryHasEntries,
      });
      return;
    }
    if (!window.confirm("Διαγραφή της κατηγορίας;\n\nΕίσαι σίγουρος; Η ενέργεια δεν αναιρείται.")) {
      return;
    }
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    const data = await res.json();
    showFromResponse(data, res.ok);
    if (res.ok) await loadMenus();
  }

  function tName(translations: Translation[]) {
    return translations.find((t) => t.language === "GR")?.name ?? translations[0]?.name ?? "—";
  }

  function startEditingCategory(cat: Category) {
    setEditingItemId(null);
    setItemCategoryId(null);
    setEditingCategoryId(cat.id);
    setEditCategoryNameGr(tName(cat.translations));
  }

  async function saveCategoryEdit(categoryId: string) {
    if (!editCategoryNameGr.trim()) {
      setFlash({ type: "error", text: "Βάλε όνομα κατηγορίας." });
      return;
    }
    setSavingCategory(true);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameGr: editCategoryNameGr.trim() }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok);
      if (res.ok) {
        setEditingCategoryId(null);
        await loadMenus();
      }
    } finally {
      setSavingCategory(false);
    }
  }

  function startEditingItem(item: Item) {
    setEditingCategoryId(null);
    setItemCategoryId(null);
    setEditingItemId(item.id);
    setEditNameGr(tName(item.translations));
    setEditPrice(item.price.toString());
    setEditPhotoUrl(item.photoUrl ?? "");
    setEditExtras(parseItemExtras(item.extras));
  }

  const activeMenu = menus.find((m) => m.id === activeMenuId) ?? menus[0];

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">Δεν έχεις ακόμα κατάστημα</p>
        <p className="mt-2 text-sm text-slate-600">
          Πρώτα φτιάξε το κατάστημά σου (εστιατόριο, bar ή ξενοδοχείο) και μετά πρόσθεσε είδη στον κατάλογο.
        </p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {DASHBOARD_EL.addVenue}
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      <DashboardToolbar>
        <label className="block min-w-[12rem] flex-1 sm:max-w-xs">
          <span className={dashboardLabelClass}>{DASHBOARD_EL.venue}</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className={dashboardFieldClass}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        {venue ? (
          <>
            {canImportPdf ? (
              <a
                href={`/dashboard/menus/import?venue=${venueId}`}
                className={`inline-flex h-10 items-center gap-1 ${buttonClass("secondary", "md")}`}
              >
                {DASHBOARD_EL.importPdf}
              </a>
            ) : (
              <a
                href="/dashboard/billing?upgrade=pdf-import"
                className={`inline-flex h-10 items-center gap-1 ${buttonClass("secondary", "md")}`}
              >
                {DASHBOARD_EL.importPdfPro}
              </a>
            )}
            <a
              href={`/m/${venue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex h-10 items-center gap-1 ${buttonClass("secondary", "md")}`}
            >
              {DASHBOARD_EL.previewCatalog}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        ) : null}
      </DashboardToolbar>

      {loading ? (
        <p className="text-sm text-slate-500">{DASHBOARD_EL.loadingCatalog}</p>
      ) : (
        <>
          {menus.length > 0 ? (
            <Card>
              <h2 className="font-semibold text-brand-navy">{DASHBOARD_EL.menus}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {menus.map((m) => {
                  const isActive = activeMenu?.id === m.id;
                  const deletable = canDeleteMenu(m);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "inline-flex items-stretch overflow-hidden rounded-full text-sm font-semibold",
                        isActive
                          ? "bg-brand-gradient text-white"
                          : "bg-brand-surface text-brand-navy ring-1 ring-slate-200",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(m.id)}
                        className="px-4 py-1.5"
                      >
                        {m.name}
                      </button>
                      {deletable ? (
                        <button
                          type="button"
                          disabled={deletingMenuId === m.id}
                          onClick={() => void deleteMenu(m)}
                          className={cn(
                            "inline-flex items-center border-l px-2 py-1.5 transition",
                            isActive
                              ? "border-white/30 hover:bg-white/15"
                              : "border-slate-200 hover:bg-slate-100",
                          )}
                          aria-label={DASHBOARD_EL.deleteCatalog}
                          title={DASHBOARD_EL.deleteCatalog}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <form onSubmit={addMenu} className="mt-4 flex flex-wrap items-end gap-2">
                <input
                  placeholder={DASHBOARD_EL.newCatalogPlaceholder}
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className={`min-w-[200px] flex-1 ${dashboardInputClass}`}
                />
                <button type="submit" disabled={addingMenu} className={buttonClass("secondary", "sm")}>
                  {addingMenu ? "..." : DASHBOARD_EL.addCatalog}
                </button>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-semibold text-brand-navy">Νέα κατηγορία</h2>
            <p className="mt-1 text-xs text-slate-500">
              Μόνο ελληνικά — EN / DE / FR δημιουργούνται αυτόματα για το QR menu
            </p>
            <form onSubmit={addCategory} className="mt-4 flex flex-wrap items-end gap-2">
              <input
                required
                placeholder={`${FORM_PLACEHOLDERS.categoryGr} *`}
                value={catNameGr}
                onChange={(e) => setCatNameGr(e.target.value)}
                className={`min-w-[200px] flex-1 ${dashboardFieldClass}`}
              />
              <button
                type="submit"
                disabled={addingCat}
                className={`inline-flex w-fit items-center gap-1 ${buttonClass("primary", "sm")}`}
              >
                <Plus className="h-4 w-4" />
                {addingCat ? "Προσθήκη..." : "Προσθήκη κατηγορίας"}
              </button>
            </form>
          </Card>

          {activeMenu?.categories.map((cat) => (
            <Card key={cat.id} className="overflow-hidden p-0">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Κατηγορία
                  </p>
                  {editingCategoryId === cat.id ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        value={editCategoryNameGr}
                        onChange={(e) => setEditCategoryNameGr(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveCategoryEdit(cat.id);
                          if (e.key === "Escape") setEditingCategoryId(null);
                        }}
                        placeholder={FORM_PLACEHOLDERS.categoryGr}
                        className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 font-serif text-lg font-bold text-brand-navy"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={savingCategory}
                        onClick={() => void saveCategoryEdit(cat.id)}
                        className={buttonClass("primary", "sm")}
                      >
                        {savingCategory ? "..." : "OK"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(null)}
                        className={buttonClass("secondary", "sm")}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-serif text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
                        {tName(cat.translations)}
                      </h3>
                      <button
                        type="button"
                        onClick={() => startEditingCategory(cat)}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-blue"
                        title="Μετονομασία κατηγορίας"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {DASHBOARD_EL.catalogEntry.count(cat.items.length)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteCategory(cat)}
                  disabled={cat.items.length > 0}
                  className={cn(
                    "shrink-0 rounded-lg p-2 transition",
                    cat.items.length > 0
                      ? "cursor-not-allowed text-slate-300"
                      : "text-slate-400 hover:bg-red-50 hover:text-red-600",
                  )}
                  title={
                    cat.items.length > 0
                      ? DASHBOARD_EL.catalogEntry.categoryDeleteHint
                      : "Διαγραφή κενής κατηγορίας"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {cat.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                    {DASHBOARD_EL.catalogEntry.empty}
                  </p>
                ) : (
                  cat.items.map((item) => {
                    const isEditing = editingItemId === item.id;
                    const extrasCount = parseItemExtras(item.extras).length;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border bg-white transition-shadow",
                          isEditing
                            ? "border-brand-blue/30 shadow-md ring-2 ring-brand-blue/10"
                            : "border-slate-200/80 shadow-sm hover:border-slate-300/80",
                        )}
                      >
                        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                          {item.photoUrl && !isEditing ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.photoUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover sm:h-14 sm:w-14"
                            />
                          ) : !isEditing ? (
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:h-14 sm:w-14"
                              aria-hidden
                            >
                              —
                            </div>
                          ) : null}

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  value={editNameGr}
                                  onChange={(e) => setEditNameGr(e.target.value)}
                                  placeholder={FORM_PLACEHOLDERS.itemNameGr}
                                  className="min-w-[8rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                  autoFocus
                                />
                                <label className="flex items-center gap-1.5 text-sm text-brand-navy">
                                  <span className="font-medium">€</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    placeholder={FORM_PLACEHOLDERS.itemPrice}
                                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                  />
                                </label>
                                <button
                                  type="button"
                                  disabled={savingName}
                                  onClick={() => void saveItemEdit(item.id)}
                                  className={buttonClass("primary", "sm")}
                                >
                                  {savingName ? "..." : "OK"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className={buttonClass("secondary", "sm")}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex min-w-0 items-center gap-2">
                                  <p
                                    className={cn(
                                      "truncate text-base font-semibold sm:text-[1.05rem]",
                                      item.available ? "text-brand-navy" : "text-slate-400 line-through",
                                    )}
                                  >
                                    {tName(item.translations)}
                                  </p>
                                  {isItemLabel(item.label) ? (
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ITEM_LABEL_STYLES[item.label]}`}
                                    >
                                      {ITEM_LABEL_OPTIONS.find((o) => o.value === item.label)?.dashboardGr}
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => startEditingItem(item)}
                                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-blue"
                                    title={DASHBOARD_EL.catalogEntry.editTitle}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditingItem(item)}
                                    className="text-sm font-semibold tabular-nums text-brand-blue hover:underline"
                                    title="Αλλαγή τιμής"
                                  >
                                    €{item.price.toString()}
                                  </button>
                                  {extrasCount > 0 ? (
                                    <span className="text-xs text-slate-500">{extrasCount} επιλογές QR</span>
                                  ) : null}
                                </div>
                              </>
                            )}
                          </div>

                          {!isEditing ? (
                            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                              <select
                                value={item.label ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  void setItemLabel(item.id, v ? (v as ItemLabel) : null);
                                }}
                                className="max-w-[8.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-brand-navy"
                                title="Ετικέτα στο QR menu"
                              >
                                <option value="">Χωρίς ετικέτα</option>
                                {ITEM_LABEL_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.dashboardGr}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => toggleItem(item)}
                                className={cn(
                                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                                  item.available
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {item.available ? "Ενεργό" : "Ανενεργό"}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title={DASHBOARD_EL.catalogEntry.deleteTitle}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 px-3 py-4 sm:px-4">
                            <PhotoUploadField value={editPhotoUrl} onChange={setEditPhotoUrl} />
                            <div className="space-y-2 rounded-lg border border-slate-200/80 bg-white p-3">
                              <p className="text-xs font-semibold text-brand-navy">Επιλογές πελάτη</p>
                              <p className="text-[11px] leading-snug text-slate-500">
                                Ο πελάτης τις επιλέγει στο QR menu. Προαιρετικά βάλε extra χρέωση (π.χ. +€1,50).
                              </p>
                              {editExtras.map((ex, i) => (
                                <div key={ex.id} className="flex items-center gap-2">
                                  <input
                                    value={ex.labels.GR}
                                    onChange={(e) => {
                                      const next = [...editExtras];
                                      next[i] = { ...ex, labels: { ...ex.labels, GR: e.target.value } };
                                      setEditExtras(next);
                                    }}
                                    placeholder={FORM_PLACEHOLDERS.extraOption}
                                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                  />
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      ex.price != null && ex.price > 0
                                        ? String(ex.price).replace(".", ",")
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const next = [...editExtras];
                                      if (raw.trim() === "") {
                                        next[i] = { ...ex, price: undefined };
                                      } else {
                                        const parsed = parseMenuPrice(raw);
                                        next[i] = {
                                          ...ex,
                                          price: Number.isFinite(parsed) && parsed >= 0 ? parsed : ex.price,
                                        };
                                      }
                                      setEditExtras(next);
                                    }}
                                    placeholder={FORM_PLACEHOLDERS.extraPrice}
                                    className="w-[4.5rem] shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                                    title="Extra χρέωση (προαιρετικό)"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditExtras(editExtras.filter((_, j) => j !== i))}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Αφαίρεση"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              {editExtras.length < 12 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditExtras([...editExtras, { id: newItemExtraId(), labels: { GR: "" } }])
                                  }
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Προσθήκη επιλογής
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}

                {itemCategoryId === cat.id ? (
                  <form
                    onSubmit={addItem}
                    className="space-y-3 rounded-xl border border-brand-blue/20 bg-brand-surface p-4 sm:p-5"
                  >
                    <p className="text-sm font-semibold text-brand-navy">{DASHBOARD_EL.catalogEntry.new}</p>
                    <p className="text-xs text-slate-500">
                      Μόνο ελληνικά — EN / DE / FR δημιουργούνται αυτόματα για το QR menu
                    </p>
                    <div className={dashboardFormGridClass}>
                      <input
                        required
                        placeholder={`${FORM_PLACEHOLDERS.itemNameGr} *`}
                        value={itemForm.nameGr}
                        onChange={(e) => setItemForm((f) => ({ ...f, nameGr: e.target.value }))}
                        className={dashboardInputClass}
                      />
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`${FORM_PLACEHOLDERS.itemPrice} *`}
                        value={itemForm.price}
                        onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                        className={dashboardInputClass}
                      />
                      <input
                        placeholder={FORM_PLACEHOLDERS.itemDescription}
                        value={itemForm.descriptionGr}
                        onChange={(e) => setItemForm((f) => ({ ...f, descriptionGr: e.target.value }))}
                        className={`${dashboardInputClass} sm:col-span-2`}
                      />
                      <PhotoUploadField
                        value={itemForm.photoUrl}
                        onChange={(url) => setItemForm((f) => ({ ...f, photoUrl: url }))}
                        className="sm:col-span-2"
                      />
                      <label className="block sm:col-span-2">
                        <span className={dashboardLabelClass}>Ετικέτα στο QR menu</span>
                        <select
                          value={itemForm.label}
                          onChange={(e) =>
                            setItemForm((f) => ({ ...f, label: e.target.value as "" | ItemLabel }))
                          }
                          className={dashboardFieldClass}
                        >
                          <option value="">Χωρίς ετικέτα</option>
                          {ITEM_LABEL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.dashboardGr}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={addingItem} className={buttonClass("primary", "sm")}>
                        {addingItem ? "Αποθήκευση..." : DASHBOARD_EL.catalogEntry.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemCategoryId(null)}
                        className={buttonClass("secondary", "sm")}
                      >
                        Ακύρωση
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setItemCategoryId(cat.id);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:text-brand-blue"
                  >
                    <Plus className="h-4 w-4" />
                    {DASHBOARD_EL.catalogEntry.add}
                  </button>
                )}
              </div>
            </Card>
          ))}

          {activeMenu?.categories.length === 0 ? (
            <Card className="border-dashed">
              <p className="text-center text-sm text-slate-500">
                Δεν υπάρχουν κατηγορίες. Πρόσθεσε την πρώτη παραπάνω για να ξεκινήσεις.
              </p>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
